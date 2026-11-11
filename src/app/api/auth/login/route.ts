import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, demoMode } = await req.json();

    let cleanEmail = demoMode ? 'umer.web2@gmail.com' : (email ? String(email).trim().toLowerCase() : '');

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify user exists in circle members
    const res = await query(
      `
      SELECT id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language
      FROM public.profiles
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
      [cleanEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'No community membership found with this email. Please sign up or request an OTP.' },
        { status: 403 }
      );
    }

    const row = res.rows[0];

    if (row.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your membership is currently suspended. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const user = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      phone: row.phone,
      mobilepayNumber: row.mobilepay_number,
      isDemo: Boolean(row.is_demo || row.email === 'umer.web2@gmail.com'),
      preferredLanguage: row.preferred_language,
    };

    await logAuditEvent({
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      actorId: user.id,
      actorEmail: user.email,
      details: { role: user.role, loginMethod: demoMode ? 'demo_instant' : 'email_session' },
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
