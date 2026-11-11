import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format');

    // Fetch all reports
    const reportsRes = await query(`
      SELECT r.*,
             p.full_name as approved_by_name,
             f.title as fund_title
      FROM public.reports r
      LEFT JOIN public.profiles p ON r.approved_by = p.id
      LEFT JOIN public.monthly_funds f ON r.fund_id = f.id
      ORDER BY r.year DESC, r.month DESC NULLS LAST, r.created_at DESC;
    `);

    const viewerEmail = req.cookies.get('circle_user_email')?.value?.trim().toLowerCase();
    const isDemoViewer = viewerEmail === 'umer.web2@gmail.com';

    // Live calculation for current fund to compare
    const liveFundsRes = await query(`
      SELECT 
        f.id as fund_id,
        f.month,
        f.year,
        f.title,
        f.target_amount,
        f.collected_amount,
        (SELECT COUNT(*) FROM public.profiles WHERE status = 'active' ${isDemoViewer ? '' : 'AND is_demo = false'}) as total_members,
        (SELECT COUNT(*) FROM public.contributions c JOIN public.profiles p ON c.member_id = p.id WHERE c.fund_id = f.id AND c.status = 'confirmed' ${isDemoViewer ? '' : 'AND p.is_demo = false'}) as paying_members,
        (SELECT COALESCE(SUM(amount), 0) FROM public.distributions WHERE fund_id = f.id) as distributed_amount
      FROM public.monthly_funds f
      ORDER BY f.year DESC, f.month DESC;
    `);

    // CSV Export option
    if (format === 'csv') {
      const headers = ['Period', 'Year', 'Month', 'Target (DKK)', 'Collected (DKK)', 'Distributed (DKK)', 'Outstanding (DKK)', 'Members', 'Paying Members', 'Status'];
      const rows = reportsRes.rows.map((r) => [
        `"${r.period_label}"`,
        r.year,
        r.month || '',
        Number(r.total_expected).toFixed(2),
        Number(r.total_collected).toFixed(2),
        Number(r.total_distributed).toFixed(2),
        Number(r.total_outstanding).toFixed(2),
        r.member_count,
        r.paying_member_count,
        r.status,
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="circle-fund-reports-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      reports: reportsRes.rows,
      livePeriods: liveFundsRes.rows,
    });
  } catch (error: any) {
    console.error('Error in /api/reports GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fundId, year, month, reportType, summaryNotes, reportId } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    if (action === 'generate_report') {
      // Calculate live numbers
      const statsRes = await query(
        `
        SELECT 
          COUNT(DISTINCT p.id) as member_count,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'confirmed') as paying_member_count,
          COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'confirmed'), 0) as total_collected,
          COALESCE((SELECT SUM(amount) FROM public.distributions WHERE fund_id = $1), 0) as total_distributed
        FROM public.profiles p
        LEFT JOIN public.contributions c ON c.member_id = p.id AND c.fund_id = $1
        WHERE p.status = 'active';
      `,
        [fundId]
      );

      const stats = statsRes.rows[0];
      const memberCount = parseInt(stats.member_count);
      const totalExpected = memberCount * 50.0;
      const totalCollected = Number(stats.total_collected);
      const totalDistributed = Number(stats.total_distributed);
      const totalOutstanding = Math.max(0, totalExpected - totalCollected);

      const periodLabel = reportType === 'annual' ? `Annual Summary ${year}` : `Monthly Report ${month}/${year}`;

      const insertRes = await query(
        `
        INSERT INTO public.reports (
          fund_id, report_type, period_label, year, month, total_expected, total_collected,
          total_distributed, total_outstanding, member_count, paying_member_count,
          status, summary_notes, approved_by, approved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12, NULL, NULL)
        RETURNING *;
      `,
        [
          fundId || null,
          reportType || 'monthly',
          periodLabel,
          year,
          month || null,
          totalExpected,
          totalCollected,
          totalDistributed,
          totalOutstanding,
          memberCount,
          parseInt(stats.paying_member_count),
          summaryNotes || null,
        ]
      );

      await logAuditEvent({
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: insertRes.rows[0].id,
        actorId: actor.id,
        actorEmail: actor.email,
        details: { periodLabel, totalCollected, totalDistributed },
      });

      return NextResponse.json({ success: true, report: insertRes.rows[0] });
    }

    if (action === 'approve_report') {
      const res = await query(
        `
        UPDATE public.reports
        SET status = 'published',
            approved_by = $1,
            approved_at = now(),
            updated_at = now()
        WHERE id = $2
        RETURNING *;
      `,
        [actor.id, reportId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const report = res.rows[0];

      // Broadcast notification
      await query(`
        INSERT INTO public.notifications (
          title_en, title_da, message_en, message_da, type, link
        )
        VALUES (
          'Report Published',
          'Rapport offentliggjort',
          'The financial report for ${report.period_label} has been published.',
          'Den økonomiske rapport for ${report.period_label} er offentliggjort.',
          'report_published',
          '/reports'
        );
      `);

      await logAuditEvent({
        action: 'REPORT_PUBLISHED',
        entityType: 'REPORT',
        entityId: reportId,
        actorId: actor.id,
        actorEmail: actor.email,
        details: { period: report.period_label },
      });

      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/reports POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
