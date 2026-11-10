import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendNotificationEmail, EmailTemplates } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actorId = actorRes.rows[0]?.id;

    const res = await query(
      `
      SELECT *
      FROM public.notifications
      WHERE recipient_id IS NULL OR recipient_id = $1
      ORDER BY created_at DESC
      LIMIT 50;
    `,
      [actorId || '00000000-0000-0000-0000-000000000000']
    );

    const unreadCount = res.rows.filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: res.rows,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error in /api/notifications GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role, full_name FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'mark_all_read') {
      await query(
        `
        UPDATE public.notifications
        SET is_read = true
        WHERE recipient_id IS NULL OR recipient_id = $1;
      `,
        [actor.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'send_payment_reminder') {
      if (actor.role !== 'admin' && actor.role !== 'collector') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      // Find pending contributions for current active fund
      const pendingRes = await query(`
        SELECT p.id, p.full_name, p.email, p.preferred_language, f.title as fund_title, 
               c.full_name as collector_name, f.mobilepay_number
        FROM public.contributions ct
        JOIN public.profiles p ON ct.member_id = p.id
        JOIN public.monthly_funds f ON ct.fund_id = f.id
        LEFT JOIN public.profiles c ON f.collector_id = c.id
        WHERE f.status = 'active' AND ct.status = 'pending';
      `);

      // Trigger notification records + safe email dispatch
      for (const row of pendingRes.rows) {
        await query(
          `
          INSERT INTO public.notifications (
            recipient_id, title_en, title_da, message_en, message_da, type, link
          )
          VALUES (
            $1,
            'Payment Reminder',
            'Betalingspåmindelse',
            'Friendly reminder: Please transfer 50 DKK via MobilePay for this month.',
            'Venlig påmindelse: Husk at overføre 50 DKK via MobilePay for denne måned.',
            'payment_reminder',
            '/fund'
          );
        `,
          [row.id]
        );

        // Safe email integration (will skip if EMAIL_ENABLED=false)
        const template =
          row.preferred_language === 'da'
            ? EmailTemplates.paymentReminder.da(row.full_name, row.fund_title, row.collector_name || 'Collector', row.mobilepay_number || '+45 00000000')
            : EmailTemplates.paymentReminder.en(row.full_name, row.fund_title, row.collector_name || 'Collector', row.mobilepay_number || '+45 00000000');

        await sendNotificationEmail({
          to: { email: row.email, name: row.full_name, language: row.preferred_language },
          subject: template.subject,
          html: template.html,
          text: template.text,
          templateType: 'payment_reminder',
        });
      }

      await logAuditEvent({
        action: 'PAYMENT_REMINDERS_SENT',
        entityType: 'NOTIFICATION',
        entityId: 'batch_reminder',
        actorId: actor.id,
        actorEmail: actor.email,
        details: { count: pendingRes.rows.length },
      });

      return NextResponse.json({
        success: true,
        remindedCount: pendingRes.rows.length,
        message: `Dispatched payment reminders to ${pendingRes.rows.length} pending members.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/notifications POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
