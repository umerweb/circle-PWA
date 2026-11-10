import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const applicationsRes = await query(`
      SELECT v.*, 
             p.full_name as member_name, 
             p.email as member_email,
             p.phone as member_phone,
             r.full_name as reviewer_name
      FROM public.collector_volunteers v
      JOIN public.profiles p ON v.member_id = p.id
      LEFT JOIN public.profiles r ON v.reviewed_by = r.id
      ORDER BY v.target_year ASC, v.target_month ASC, v.created_at DESC;
    `);

    const pastCollectorsRes = await query(`
      SELECT f.month, f.year, f.title, f.collected_amount,
             p.id as collector_id, p.full_name as collector_name, p.email as collector_email,
             f.mobilepay_number
      FROM public.monthly_funds f
      JOIN public.profiles p ON f.collector_id = p.id
      ORDER BY f.year DESC, f.month DESC;
    `);

    return NextResponse.json({
      applications: applicationsRes.rows,
      pastCollectors: pastCollectorsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching collector volunteers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, volunteerId, targetMonth, targetYear, mobilepayNumber, notes } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'apply') {
      if (!targetMonth || !targetYear || !mobilepayNumber) {
        return NextResponse.json({ error: 'Target month, year and MobilePay number are required' }, { status: 400 });
      }

      const res = await query(
        `
        INSERT INTO public.collector_volunteers (
          member_id, target_month, target_year, mobilepay_number, notes, status
        )
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *;
      `,
        [actor.id, parseInt(targetMonth), parseInt(targetYear), mobilepayNumber, notes || null]
      );

      await logAuditEvent({
        action: 'COLLECTOR_APPLICATION_SUBMITTED',
        entityType: 'COLLECTOR_VOLUNTEER',
        entityId: res.rows[0].id,
        actorId: actor.id,
        actorEmail: actor.email,
        details: { targetMonth, targetYear, mobilepayNumber },
      });

      return NextResponse.json({ success: true, application: res.rows[0] });
    }

    if (action === 'approve') {
      if (actor.role !== 'admin') {
        return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
      }

      const client = await getClient();
      try {
        await client.query('BEGIN');

        const volRes = await client.query(
          `
          UPDATE public.collector_volunteers
          SET status = 'approved',
              reviewed_by = $1,
              reviewed_at = now(),
              updated_at = now()
          WHERE id = $2
          RETURNING *;
        `,
          [actor.id, volunteerId]
        );

        if (volRes.rows.length === 0) {
          throw new Error('Volunteer application not found');
        }

        const vol = volRes.rows[0];

        // Update target monthly fund with this collector and MobilePay details
        await client.query(
          `
          UPDATE public.monthly_funds
          SET collector_id = $1,
              mobilepay_number = $2,
              payment_instructions = $3,
              updated_at = now()
          WHERE month = $4 AND year = $5;
        `,
          [
            vol.member_id,
            vol.mobilepay_number,
            `Overfør 50 DKK via MobilePay til månedens indsamler. Angiv note: CF-${vol.target_month}-${vol.target_year}.`,
            vol.target_month,
            vol.target_year,
          ]
        );

        // Update member role to collector
        await client.query(`UPDATE public.profiles SET role = 'collector' WHERE id = $1;`, [vol.member_id]);

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'COLLECTOR_APPROVED',
          entityType: 'COLLECTOR_VOLUNTEER',
          entityId: volunteerId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { memberId: vol.member_id, month: vol.target_month, year: vol.target_year },
        });

        return NextResponse.json({ success: true, application: vol });
      } catch (e: any) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    if (action === 'reject') {
      if (actor.role !== 'admin') {
        return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
      }

      const res = await query(
        `
        UPDATE public.collector_volunteers
        SET status = 'rejected',
            reviewed_by = $1,
            reviewed_at = now(),
            updated_at = now()
        WHERE id = $2
        RETURNING *;
      `,
        [actor.id, volunteerId]
      );

      await logAuditEvent({
        action: 'COLLECTOR_APPLICATION_REJECTED',
        entityType: 'COLLECTOR_VOLUNTEER',
        entityId: volunteerId,
        actorId: actor.id,
        actorEmail: actor.email,
        details: {},
      });

      return NextResponse.json({ success: true, application: res.rows[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/volunteers POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
