import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let fundQuery = `
      SELECT f.*, 
             p.full_name as collector_name, 
             p.email as collector_email,
             p.mobilepay_number as collector_mobilepay
      FROM public.monthly_funds f
      LEFT JOIN public.profiles p ON f.collector_id = p.id
    `;
    const params: any[] = [];

    if (month && year) {
      fundQuery += ` WHERE f.month = $1 AND f.year = $2 LIMIT 1`;
      params.push(parseInt(month), parseInt(year));
    } else {
      fundQuery += ` ORDER BY f.year DESC, f.month DESC LIMIT 1`;
    }

    const fundRes = await query(fundQuery, params);

    if (fundRes.rows.length === 0) {
      return NextResponse.json({ fund: null, contributions: [] });
    }

    const fund = fundRes.rows[0];

    const emailCookie = req.cookies.get('circle_user_email')?.value?.trim().toLowerCase();
    const isDemoViewer = emailCookie === 'umer.web2@gmail.com';

    // Get contributions for this fund (Strict isolation: real users only see real members)
    const contribRes = await query(
      `
      SELECT c.*,
             p.full_name as member_name,
             p.email as member_email,
             p.phone as member_phone,
             p.is_demo as member_is_demo,
             v.full_name as confirmed_by_name
      FROM public.contributions c
      JOIN public.profiles p ON c.member_id = p.id
      LEFT JOIN public.profiles v ON c.confirmed_by = v.id
      WHERE c.fund_id = $1 ${isDemoViewer ? '' : 'AND p.is_demo = false'}
      ORDER BY 
        c.is_collector_contribution DESC,
        CASE c.status 
          WHEN 'reported' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'confirmed' THEN 3 
          ELSE 4 
        END,
        p.full_name ASC;
    `,
      [fund.id]
    );

    // Calculate live aggregates
    const contributions = contribRes.rows;
    const minThreshold = Number(fund.min_contribution || 50.0);
    let totalTarget = 0;
    let totalConfirmed = 0;
    let totalReported = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let reportedCount = 0;

    for (const c of contributions) {
      const amt = Number(c.amount);
      totalTarget += amt > 0 ? amt : minThreshold;
      if (c.status === 'confirmed') {
        totalConfirmed += amt;
        paidCount++;
      } else if (c.status === 'reported') {
        totalReported += amt;
        reportedCount++;
      } else {
        pendingCount++;
      }
    }

    // Fallback target for empty real state
    if (!isDemoViewer && totalTarget === 0) {
      totalTarget = minThreshold;
    }

    return NextResponse.json({
      fund: {
        ...fund,
        target_amount: isDemoViewer ? fund.target_amount : totalTarget,
        collected_amount: isDemoViewer ? fund.collected_amount : totalConfirmed,
        computedTarget: isDemoViewer ? (fund.computedTarget || totalTarget) : totalTarget,
        computedCollected: totalConfirmed,
        totalReported,
        paidCount,
        pendingCount,
        reportedCount,
        totalMembers: contributions.length,
      },
      contributions,
    });
  } catch (error: any) {
    console.error('Error fetching fund details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, contributionId, fundId, memberId, amount, paymentReference, memberNote, exceptionReason } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (action === 'report_payment') {
        // Member marks payment as sent
        let targetId = contributionId;

        // If contributionId wasn't passed directly, find or insert one for this member & fund
        if (!targetId && fundId) {
          const findRes = await client.query(
            `SELECT id FROM public.contributions WHERE fund_id = $1 AND member_id = $2 LIMIT 1`,
            [fundId, actor.id]
          );
          if (findRes.rows.length > 0) {
            targetId = findRes.rows[0].id;
          } else {
            const insertRes = await client.query(
              `INSERT INTO public.contributions (
                fund_id, member_id, amount, status, is_collector_contribution, payment_reference, member_note, reported_at
              ) VALUES (
                $1, $2, COALESCE($3, 50.00), 'reported', false, $4, $5, now()
              ) RETURNING *;`,
              [fundId, actor.id, amount ? Number(amount) : 50.00, paymentReference || null, memberNote || null]
            );
            await client.query('COMMIT');
            await logAuditEvent({
              action: 'PAYMENT_REPORTED',
              entityType: 'CONTRIBUTION',
              entityId: insertRes.rows[0].id,
              actorId: actor.id,
              actorEmail: actor.email,
              details: { amount: insertRes.rows[0].amount, paymentReference, memberNote },
            });
            return NextResponse.json({ success: true, contribution: insertRes.rows[0] });
          }
        }

        const res = await client.query(
          `
          UPDATE public.contributions
          SET status = 'reported',
              reported_at = now(),
              amount = COALESCE($1, amount),
              payment_reference = $2,
              member_note = $3,
              updated_at = now()
          WHERE id = $4
          RETURNING *;
        `,
          [amount ? Number(amount) : null, paymentReference || null, memberNote || null, targetId]
        );

        if (res.rows.length === 0) {
          throw new Error('Contribution record not found');
        }

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'PAYMENT_REPORTED',
          entityType: 'CONTRIBUTION',
          entityId: targetId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { amount, paymentReference, memberNote },
        });

        return NextResponse.json({ success: true, contribution: res.rows[0] });
      }

      // Delete payment / contribution (Admin full control)
      if (action === 'delete_payment') {
        if (actor.role !== 'admin') {
          return NextResponse.json({ error: 'Administrator privileges required to delete payments' }, { status: 403 });
        }
        if (!contributionId) {
          return NextResponse.json({ error: 'Contribution ID is required' }, { status: 400 });
        }

        const contribRes = await client.query(
          `SELECT * FROM public.contributions WHERE id = $1 FOR UPDATE;`,
          [contributionId]
        );
        if (contribRes.rows.length === 0) {
          throw new Error('Contribution record not found');
        }
        const contrib = contribRes.rows[0];

        await client.query(`DELETE FROM public.contributions WHERE id = $1;`, [contributionId]);

        // Recalculate monthly fund
        await client.query(
          `
          UPDATE public.monthly_funds
          SET target_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.contributions
            WHERE fund_id = $1
          ),
          collected_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.contributions
            WHERE fund_id = $1 AND status = 'confirmed'
          ),
          updated_at = now()
          WHERE id = $1;
        `,
          [contrib.fund_id]
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'PAYMENT_DELETED',
          entityType: 'CONTRIBUTION',
          entityId: contributionId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { memberId: contrib.member_id, amount: contrib.amount },
        });

        return NextResponse.json({ success: true, message: 'Payment record deleted successfully' });
      }

      // Set Monthly Threshold (Admin full control)
      if (action === 'set_monthly_threshold') {
        if (actor.role !== 'admin') {
          return NextResponse.json({ error: 'Administrator privileges required to set threshold' }, { status: 403 });
        }
        const minAmt = Number(body.minContribution ?? body.threshold ?? 50);
        if (isNaN(minAmt) || minAmt < 0) {
          return NextResponse.json({ error: 'Threshold amount must be a positive number' }, { status: 400 });
        }

        // Update pending contributions to the new threshold
        await client.query(
          `
          UPDATE public.contributions
          SET amount = $1,
              updated_at = now()
          WHERE fund_id = $2 AND status = 'pending';
        `,
          [minAmt, fundId]
        );

        // Recalculate target_amount on monthly_funds
        const updateFundRes = await client.query(
          `
          UPDATE public.monthly_funds
          SET min_contribution = $1,
              target_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.contributions
                WHERE fund_id = $2
              ),
              updated_at = now()
          WHERE id = $2
          RETURNING *;
        `,
          [minAmt, fundId]
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'MONTHLY_THRESHOLD_UPDATED',
          entityType: 'FUND',
          entityId: fundId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { minContribution: minAmt },
        });

        return NextResponse.json({ success: true, fund: updateFundRes.rows[0] });
      }

      if (action === 'confirm_payment') {
        // Collector or Admin verifies payment receipt in MobilePay
        const contribRes = await client.query(
          `
          SELECT c.*, f.id as fund_id 
          FROM public.contributions c
          JOIN public.monthly_funds f ON c.fund_id = f.id
          WHERE c.id = $1
          FOR UPDATE;
        `,
          [contributionId]
        );

        if (contribRes.rows.length === 0) {
          throw new Error('Contribution record not found');
        }

        const contrib = contribRes.rows[0];
        const confirmedAmt = amount ? Number(amount) : Number(contrib.amount);

        const updateRes = await client.query(
          `
          UPDATE public.contributions
          SET status = 'confirmed',
              amount = $1,
              confirmed_at = now(),
              confirmed_by = $2,
              payment_reference = COALESCE($3, payment_reference),
              updated_at = now()
          WHERE id = $4
          RETURNING *;
        `,
          [confirmedAmt, actor.id, paymentReference || null, contributionId]
        );

        // Recalculate and update monthly_funds.collected_amount
        await client.query(
          `
          UPDATE public.monthly_funds
          SET collected_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.contributions
            WHERE fund_id = $1 AND status = 'confirmed'
          ),
          updated_at = now()
          WHERE id = $1;
        `,
          [contrib.fund_id]
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'PAYMENT_CONFIRMED',
          entityType: 'CONTRIBUTION',
          entityId: contributionId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { amount: confirmedAmt, memberId: contrib.member_id },
        });

        return NextResponse.json({ success: true, contribution: updateRes.rows[0] });
      }

      if (action === 'grant_exception') {
        // Admin or collector grants approved exception
        const res = await client.query(
          `
          UPDATE public.contributions
          SET status = 'exempt',
              exception_reason = $1,
              confirmed_by = $2,
              confirmed_at = now(),
              updated_at = now()
          WHERE id = $3
          RETURNING *;
        `,
          [exceptionReason || 'Approved exception', actor.id, contributionId]
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'PAYMENT_EXCEPTION_GRANTED',
          entityType: 'CONTRIBUTION',
          entityId: contributionId,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { reason: exceptionReason },
        });

        return NextResponse.json({ success: true, contribution: res.rows[0] });
      }

      if (action === 'create_fund') {
        // Open a new monthly collection
        const { month, year, title, targetAmount, collectorId, mobilepayNumber, instructions } = body;

        const fundInsert = await client.query(
          `
          INSERT INTO public.monthly_funds (
            month, year, title, target_amount, collected_amount, min_contribution,
            status, collector_id, mobilepay_number, payment_instructions
          )
          VALUES ($1, $2, $3, $4, 0, 50.00, 'active', $5, $6, $7)
          ON CONFLICT (year, month) DO UPDATE SET
            collector_id = EXCLUDED.collector_id,
            mobilepay_number = EXCLUDED.mobilepay_number,
            payment_instructions = EXCLUDED.payment_instructions
          RETURNING *;
        `,
          [
            month,
            year,
            title || `Month ${month} ${year}`,
            targetAmount || 2000.0,
            collectorId || null,
            mobilepayNumber || null,
            instructions || 'Overfør 50 DKK via MobilePay.',
          ]
        );

        const newFund = fundInsert.rows[0];

        // Populate contribution rows for all active members
        await client.query(
          `
          INSERT INTO public.contributions (fund_id, member_id, amount, status, is_collector_contribution)
          SELECT $1, id, 50.00, 'pending', (id = $2)
          FROM public.profiles
          WHERE status = 'active'
          ON CONFLICT (fund_id, member_id) DO NOTHING;
        `,
          [newFund.id, collectorId || '00000000-0000-0000-0000-000000000000']
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'MONTHLY_FUND_OPENED',
          entityType: 'MONTHLY_FUND',
          entityId: newFund.id,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { month, year, title },
        });

        return NextResponse.json({ success: true, fund: newFund });
      }

      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in /api/fund POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
