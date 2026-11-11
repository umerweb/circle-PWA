import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(otpCode).trim().replace(/\s+/g, '');

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: 'Verification code must be 6 digits' }, { status: 400 });
    }

    // 1. Fetch active OTP record
    const otpRes = await query(
      `SELECT id, email, otp_code, purpose, metadata, attempts, max_attempts, expires_at, verified_at
       FROM public.auth_otps
       WHERE LOWER(email) = $1 AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1;`,
      [cleanEmail]
    );

    if (otpRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active verification code found for this email. Please request a new code.' },
        { status: 400 }
      );
    }

    const otpRecord = otpRes.rows[0];

    // 2. Check expiration
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new one.', expired: true },
        { status: 400 }
      );
    }

    // 3. Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new verification code.', maxAttemptsReached: true },
        { status: 429 }
      );
    }

    // 4. Validate Code
    if (otpRecord.otp_code !== cleanCode) {
      const newAttempts = otpRecord.attempts + 1;
      await query(`UPDATE public.auth_otps SET attempts = $1 WHERE id = $2`, [newAttempts, otpRecord.id]);
      const remaining = otpRecord.max_attempts - newAttempts;

      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new code.', maxAttemptsReached: true },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Invalid verification code. ${remaining} attempt(s) remaining.`, remainingAttempts: remaining },
        { status: 400 }
      );
    }

    // 5. Code is correct! Mark OTP verified
    await query(`UPDATE public.auth_otps SET verified_at = NOW() WHERE id = $1`, [otpRecord.id]);

    // 6. User Provisioning / Login Resolution
    const client = await getClient();
    let userRow: any = null;

    try {
      await client.query('BEGIN');

      const existingUser = await client.query(
        `SELECT id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language
         FROM public.profiles
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [cleanEmail]
      );

      const adminEmail = (process.env.ADMIN_EMAIL || 'umer.web2@gmail.com').trim().toLowerCase();
      const isAdminEmail = cleanEmail === adminEmail;

      if (existingUser.rows.length > 0) {
        userRow = existingUser.rows[0];

        if (userRow.status === 'suspended') {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Your membership is suspended. Please contact the administrator.' },
            { status: 403 }
          );
        }

        // If it's the designated admin email and role isn't admin, promote
        if (isAdminEmail && userRow.role !== 'admin') {
          await client.query(
            `UPDATE public.profiles SET role = 'admin', updated_at = NOW() WHERE id = $1`,
            [userRow.id]
          );
          userRow.role = 'admin';
        }
      } else {
        // Create new production member profile
        const metadata = otpRecord.metadata || {};
        const fullName = metadata.fullName || cleanEmail.split('@')[0];
        const phone = metadata.phone || null;
        const mobilepayNumber = metadata.mobilepayNumber || null;
        const preferredLanguage = metadata.language === 'da' ? 'da' : 'en';
        const role = isAdminEmail ? 'admin' : 'member';

        const createRes = await client.query(
          `INSERT INTO public.profiles (
            id, email, full_name, phone, mobilepay_number, role, status, is_demo, preferred_language
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, 'active', false, $6
          )
          RETURNING id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language`,
          [cleanEmail, fullName, phone, mobilepayNumber, role, preferredLanguage]
        );
        userRow = createRes.rows[0];

        // If there is an active monthly collection, enroll new member automatically
        const activeFundRes = await client.query(
          `SELECT id, min_contribution FROM public.monthly_funds WHERE status = 'active' ORDER BY year DESC, month DESC LIMIT 1`
        );

        if (activeFundRes.rows.length > 0) {
          const fund = activeFundRes.rows[0];
          await client.query(
            `INSERT INTO public.contributions (
              fund_id, member_id, amount, status, is_collector_contribution
            ) VALUES (
              $1, $2, $3, 'pending', false
            ) ON CONFLICT (fund_id, member_id) DO NOTHING;`,
            [fund.id, userRow.id, fund.min_contribution || 50.00]
          );
        }

        await logAuditEvent({
          action: 'USER_SIGNUP',
          entityType: 'AUTH',
          entityId: userRow.id,
          actorId: userRow.id,
          actorEmail: userRow.email,
          details: { role: userRow.role, method: 'email_otp' },
        });
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    // 7. Audit log for session login
    await logAuditEvent({
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: userRow.id,
      actorId: userRow.id,
      actorEmail: userRow.email,
      details: { role: userRow.role, method: 'email_otp' },
    });

    const user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      status: userRow.status,
      phone: userRow.phone,
      mobilepayNumber: userRow.mobilepay_number,
      isDemo: userRow.is_demo || userRow.email === 'umer.web2@gmail.com',
      preferredLanguage: userRow.preferred_language,
    };

    const response = NextResponse.json({ success: true, user });

    // Set 30-day session cookie
    response.cookies.set('circle_user_email', user.email, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/otp/verify:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
