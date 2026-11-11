import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, purpose = 'signup', fullName, password, newPassword, phone, mobilepayNumber, language = 'en' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (purpose !== 'login' && purpose !== 'signup' && purpose !== 'forgot_password') {
      return NextResponse.json({ error: 'Invalid purpose specified' }, { status: 400 });
    }

    // 1. Business Logic Checks based on purpose
    let recipientName = fullName?.trim();
    let passwordHashToStore: string | null = null;

    if (purpose === 'signup') {
      if (!fullName || fullName.trim().length < 2) {
        return NextResponse.json(
          { error: 'Please provide your full legal or preferred name (at least 2 characters)' },
          { status: 400 }
        );
      }

      if (!password || String(password).length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const existingProfile = await query(
        `SELECT id FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`,
        [cleanEmail]
      );

      if (existingProfile.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please sign in instead.',
            alreadyRegistered: true,
          },
          { status: 409 }
        );
      }

      passwordHashToStore = hashPassword(String(password));
    } else if (purpose === 'forgot_password') {
      if (!newPassword || String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const profileRes = await query(
        `SELECT id, email, full_name, status FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`,
        [cleanEmail]
      );

      if (profileRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'No account found with this email address.', notRegistered: true },
          { status: 404 }
        );
      }

      recipientName = profileRes.rows[0].full_name;
      passwordHashToStore = hashPassword(String(newPassword));
    } else if (purpose === 'login') {
      const profileRes = await query(
        `SELECT id, email, full_name, status FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1`,
        [cleanEmail]
      );

      if (profileRes.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'No account found with this email. Please create a new account to join.',
            notRegistered: true,
          },
          { status: 404 }
        );
      }

      const profile = profileRes.rows[0];
      recipientName = profile.full_name;

      if (profile.status === 'suspended') {
        return NextResponse.json(
          {
            error: 'Your membership is suspended. Please contact the administrator at umer.web2@gmail.com.',
            suspended: true,
          },
          { status: 403 }
        );
      }
    }

    // 2. Rate Limiting & Cooldown Protection
    const recentOtpRes = await query(
      `SELECT created_at FROM public.auth_otps 
       WHERE LOWER(email) = $1 AND created_at > NOW() - INTERVAL '60 seconds' 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    if (recentOtpRes.rows.length > 0) {
      const createdAt = new Date(recentOtpRes.rows[0].created_at).getTime();
      const secondsPassed = Math.floor((Date.now() - createdAt) / 1000);
      const remainingSeconds = Math.max(1, 60 - secondsPassed);
      return NextResponse.json(
        {
          error: `Please wait ${remainingSeconds}s before requesting a new verification code.`,
          cooldownRemaining: remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Hourly volume protection (max 5 OTPs per hour per email)
    const hourlyRes = await query(
      `SELECT COUNT(*) as count FROM public.auth_otps 
       WHERE LOWER(email) = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [cleanEmail]
    );

    if (parseInt(hourlyRes.rows[0].count) >= 5) {
      return NextResponse.json(
        { error: 'Too many verification code requests for this email. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // 3. Generate Secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Invalidate older pending OTPs for this email
    await query(
      `DELETE FROM public.auth_otps WHERE LOWER(email) = $1 AND verified_at IS NULL`,
      [cleanEmail]
    );

    // 5. Store OTP in PostgreSQL
    const metadata = {
      fullName: recipientName || null,
      phone: phone?.trim() || null,
      mobilepayNumber: mobilepayNumber?.trim() || null,
      language: language === 'da' ? 'da' : 'en',
      passwordHash: passwordHashToStore || null,
    };

    await query(
      `INSERT INTO public.auth_otps (email, otp_code, purpose, metadata, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
      [cleanEmail, otpCode, purpose, JSON.stringify(metadata)]
    );

    // 6. Send OTP Email via Resend
    const delivery = await sendOtpEmail({
      to: cleanEmail,
      name: recipientName,
      code: otpCode,
      purpose,
      language: language === 'da' ? 'da' : 'en',
    });

    if (!delivery.success && !delivery.skipped) {
      console.error('[OTP REQUEST] Delivery failed:', delivery.reason);
      return NextResponse.json(
        { error: 'Failed to deliver verification email. Please verify your address and try again.' },
        { status: 502 }
      );
    }

    // 7. Audit Logging
    await logAuditEvent({
      action: 'OTP_REQUESTED',
      entityType: 'AUTH',
      entityId: cleanEmail,
      actorEmail: cleanEmail,
      details: { purpose, skippedDelivery: delivery.skipped },
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      cooldownSeconds: 60,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/otp/request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
