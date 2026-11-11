import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password, demoMode } = await req.json();

    let cleanEmail = demoMode ? 'umer.web2@gmail.com' : (email ? String(email).trim().toLowerCase() : '');

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'umer.web2@gmail.com').trim().toLowerCase();
    const isAdminEmail = cleanEmail === adminEmail;

    // Verify user exists in circle members
    const res = await query(
      `
      SELECT id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language, password_hash
      FROM public.profiles
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
      [cleanEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email. Please register to create an account.', notRegistered: true },
        { status: 404 }
      );
    }

    const row = res.rows[0];

    if (row.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your membership is currently suspended. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Verify Password
    const isDemoSupervisor = cleanEmail === 'umer.web2@gmail.com';
    if (isDemoSupervisor) {
      // Demo supervisor fallback (12345678 or hashed password)
      const isDirectAdminPass = password === '12345678' || demoMode;
      const isHashedAdminPass = password && row.password_hash ? verifyPassword(password, row.password_hash) : false;
      if (!isDirectAdminPass && !isHashedAdminPass) {
        return NextResponse.json(
          { error: 'Incorrect demo administrator password. (Default demo pass: 12345678)' },
          { status: 401 }
        );
      }
    } else {
      // Real production users (both real admins and real members)
      if (!password) {
        return NextResponse.json(
          { error: 'Please enter your password to sign in.' },
          { status: 400 }
        );
      }

      if (!row.password_hash) {
        return NextResponse.json(
          { error: 'Password not set for this account. Please use "Forgot password?" to set one.' },
          { status: 400 }
        );
      }

      const isValidPassword = verifyPassword(password, row.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Incorrect email or password. Please try again.' },
          { status: 401 }
        );
      }
    }

    const user = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      phone: row.phone,
      mobilepayNumber: row.mobilepay_number,
      isDemo: Boolean(isDemoSupervisor || row.is_demo),
      preferredLanguage: row.preferred_language,
    };

    await logAuditEvent({
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      actorId: user.id,
      actorEmail: user.email,
      details: { role: user.role, loginMethod: 'email_password' },
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('circle_user_email', user.email, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
