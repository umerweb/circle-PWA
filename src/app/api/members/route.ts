import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');

    const viewerEmail = req.cookies.get('circle_user_email')?.value?.trim().toLowerCase();
    const isDemoViewer = viewerEmail === 'umer.web2@gmail.com';

    let sql = `
      SELECT id, email, full_name, phone, mobilepay_number, role, status, is_demo, preferred_language, created_at,
             (SELECT COUNT(*) FROM public.contributions WHERE member_id = p.id AND status = 'confirmed') as confirmed_payments_count
      FROM public.profiles p
      WHERE 1=1
    `;
    const params: any[] = [];

    // Real members NEVER see demo placeholder members
    if (!isDemoViewer) {
      sql += ` AND p.is_demo = false`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.full_name ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.phone ILIKE $${params.length})`;
    }

    if (role && role !== 'all') {
      params.push(role);
      sql += ` AND p.role = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }

    sql += ` ORDER BY p.role = 'admin' DESC, p.is_demo ASC, p.created_at ASC`;

    const res = await query(sql, params);

    // Summary counts (Isolated: only demo viewer sees dummy counters)
    const countsRes = await query(
      isDemoViewer
        ? `SELECT 
            COUNT(*) as total_members,
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE is_demo = true) as demo_count
           FROM public.profiles;`
        : `SELECT 
            COUNT(*) as total_members,
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            0 as demo_count
           FROM public.profiles
           WHERE is_demo = false;`
    );

    return NextResponse.json({
      members: res.rows,
      summary: countsRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, memberId, fullName, email, phone, mobilepayNumber, role, status, notes } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    // 1. Add member manually
    if (action === 'add_member') {
      if (!fullName || !email) {
        return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
      }

      const client = await getClient();
      try {
        await client.query('BEGIN');

        const insertRes = await client.query(
          `
          INSERT INTO public.profiles (
            full_name, email, phone, mobilepay_number, role, status, is_demo, notes
          )
          VALUES ($1, $2, $3, $4, $5, 'active', false, $6)
          RETURNING *;
        `,
          [fullName, email.toLowerCase().trim(), phone || null, mobilepayNumber || null, role || 'member', notes || null]
        );

        const newMember = insertRes.rows[0];

        // Add to active monthly fund if exists
        const activeFundRes = await client.query(
          `SELECT id, target_amount FROM public.monthly_funds WHERE status = 'active' ORDER BY year DESC, month DESC LIMIT 1;`
        );
        if (activeFundRes.rows.length > 0) {
          const activeFund = activeFundRes.rows[0];
          await client.query(
            `
            INSERT INTO public.contributions (fund_id, member_id, amount, status)
            VALUES ($1, $2, 50.00, 'pending')
            ON CONFLICT (fund_id, member_id) DO NOTHING;
          `,
            [activeFund.id, newMember.id]
          );

          await client.query(
            `
            UPDATE public.monthly_funds
            SET target_amount = target_amount + 50.00
            WHERE id = $1;
          `,
            [activeFund.id]
          );
        }

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'MEMBER_ADDED_MANUALLY',
          entityType: 'MEMBER',
          entityId: newMember.id,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { fullName, email, role },
        });

        return NextResponse.json({ success: true, member: newMember });
      } catch (e: any) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // 2. Edit Member
    if (action === 'edit_member') {
      const res = await query(
        `
        UPDATE public.profiles
        SET full_name = COALESCE($1, full_name),
            phone = COALESCE($2, phone),
            mobilepay_number = COALESCE($3, mobilepay_number),
            role = COALESCE($4, role),
            status = COALESCE($5, status),
            notes = COALESCE($6, notes),
            updated_at = now()
        WHERE id = $7
        RETURNING *;
      `,
        [fullName, phone, mobilepayNumber, role, status, notes, memberId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      await logAuditEvent({
        action: 'MEMBER_UPDATED',
        entityType: 'MEMBER',
        entityId: memberId,
        actorId: actor.id,
        actorEmail: actor.email,
        details: { fullName, role, status },
      });

      return NextResponse.json({ success: true, member: res.rows[0] });
    }

    // 3. Remove all demo data before production
    if (action === 'remove_demo_data') {
      const client = await getClient();
      try {
        await client.query('BEGIN');

        // Delete demo contributions and records
        await client.query(`
          DELETE FROM public.contributions
          WHERE member_id IN (SELECT id FROM public.profiles WHERE is_demo = true);
        `);

        await client.query(`
          DELETE FROM public.collector_volunteers
          WHERE member_id IN (SELECT id FROM public.profiles WHERE is_demo = true);
        `);

        const deleteProfiles = await client.query(`
          DELETE FROM public.profiles
          WHERE is_demo = true
          RETURNING id;
        `);

        // Recalculate monthly fund target and collected amount
        await client.query(`
          UPDATE public.monthly_funds f
          SET target_amount = (
                SELECT COUNT(*) * 50.00
                FROM public.profiles
                WHERE status = 'active'
              ),
              collected_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.contributions
                WHERE fund_id = f.id AND status = 'confirmed'
              );
        `);

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'DEMO_DATA_PURGED',
          entityType: 'SYSTEM',
          entityId: 'purge_demo',
          actorId: actor.id,
          actorEmail: actor.email,
          details: { removedCount: deleteProfiles.rows.length },
        });

        return NextResponse.json({
          success: true,
          removedCount: deleteProfiles.rows.length,
          message: `Successfully removed ${deleteProfiles.rows.length} demo members and cleaned financial records.`,
        });
      } catch (e: any) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/members POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
