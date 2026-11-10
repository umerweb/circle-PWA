import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const isAdmin = actorRes.rows[0]?.role === 'admin';

    const beneficiariesRes = await query(`
      SELECT b.*,
             (SELECT COUNT(*) FROM public.distributions WHERE beneficiary_id = b.id) as distribution_count
      FROM public.beneficiaries b
      ORDER BY b.created_at DESC;
    `);

    const distributionsRes = await query(`
      SELECT d.*,
             b.alias_name,
             b.full_name as raw_full_name,
             b.is_anonymous,
             p.full_name as recorded_by_name,
             f.title as fund_title
      FROM public.distributions d
      JOIN public.beneficiaries b ON d.beneficiary_id = b.id
      LEFT JOIN public.profiles p ON d.recorded_by = p.id
      LEFT JOIN public.monthly_funds f ON d.fund_id = f.id
      ORDER BY d.distribution_date DESC, d.created_at DESC;
    `);

    // Redact sensitive details for non-admins
    const beneficiaries = beneficiariesRes.rows.map((b) => {
      if (!isAdmin && b.is_anonymous) {
        return {
          ...b,
          full_name: b.alias_name,
          contact_info: '[Protected - Confidential Case]',
        };
      }
      return b;
    });

    const distributions = distributionsRes.rows.map((d) => {
      if (!isAdmin && d.is_anonymous) {
        return {
          ...d,
          raw_full_name: d.alias_name,
        };
      }
      return d;
    });

    // Aggregates
    const statsRes = await query(`
      SELECT 
        COUNT(DISTINCT id) as total_beneficiaries,
        COALESCE(SUM(total_allocated), 0) as total_distributed
      FROM public.beneficiaries;
    `);

    return NextResponse.json({
      beneficiaries,
      distributions,
      stats: statsRes.rows[0],
      isAdmin,
    });
  } catch (error: any) {
    console.error('Error fetching beneficiaries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fullName, aliasName, category, reason, isAnonymous, contactInfo, beneficiaryId, fundId, amount, distributionDate, description, evidenceReference } = body;

    const emailCookie = req.cookies.get('circle_user_email')?.value || 'umer.web2@gmail.com';
    const actorRes = await query('SELECT id, email, role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
    const actor = actorRes.rows[0];

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    if (action === 'add_beneficiary') {
      if (!fullName || !category || !reason) {
        return NextResponse.json({ error: 'Name, category and reason are required' }, { status: 400 });
      }

      const res = await query(
        `
        INSERT INTO public.beneficiaries (
          full_name, alias_name, category, reason, is_anonymous, contact_info, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `,
        [
          fullName,
          aliasName || `Community Case #${Date.now().toString().slice(-4)}`,
          category,
          reason,
          Boolean(isAnonymous),
          contactInfo || null,
          actor.id,
        ]
      );

      await logAuditEvent({
        action: 'BENEFICIARY_ADDED',
        entityType: 'BENEFICIARY',
        entityId: res.rows[0].id,
        actorId: actor.id,
        actorEmail: actor.email,
        details: { category, isAnonymous: Boolean(isAnonymous) },
      });

      return NextResponse.json({ success: true, beneficiary: res.rows[0] });
    }

    if (action === 'record_distribution') {
      if (!beneficiaryId || !amount || !description) {
        return NextResponse.json({ error: 'Beneficiary, amount and description are required' }, { status: 400 });
      }

      const client = await getClient();
      try {
        await client.query('BEGIN');

        const distRes = await client.query(
          `
          INSERT INTO public.distributions (
            beneficiary_id, fund_id, amount, distribution_date, category, description, evidence_reference, recorded_by
          )
          VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8)
          RETURNING *;
        `,
          [
            beneficiaryId,
            fundId || null,
            Number(amount),
            distributionDate || null,
            category || 'general',
            description,
            evidenceReference || null,
            actor.id,
          ]
        );

        // Update beneficiary total_allocated
        await client.query(
          `
          UPDATE public.beneficiaries
          SET total_allocated = total_allocated + $1,
              updated_at = now()
          WHERE id = $2;
        `,
          [Number(amount), beneficiaryId]
        );

        await client.query('COMMIT');

        await logAuditEvent({
          action: 'DISTRIBUTION_RECORDED',
          entityType: 'DISTRIBUTION',
          entityId: distRes.rows[0].id,
          actorId: actor.id,
          actorEmail: actor.email,
          details: { amount: Number(amount), beneficiaryId, evidenceReference },
        });

        return NextResponse.json({ success: true, distribution: distRes.rows[0] });
      } catch (e: any) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/beneficiaries POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
