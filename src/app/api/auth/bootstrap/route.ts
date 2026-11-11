import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { hashPassword } from '@/lib/password';

export async function GET() {
  try {
    const res = await query(
      `
      SELECT id, email, full_name, role, status, is_demo, created_at
      FROM public.profiles
      WHERE role = 'admin' AND is_demo = false
      ORDER BY created_at ASC
      LIMIT 1;
    `
    );

    const admin = res.rows[0] || null;

    return NextResponse.json({
      configured: Boolean(admin),
      adminEmail: admin ? admin.email : null,
      adminStatus: admin ? admin.status : 'not_configured',
    });
  } catch (error: any) {
    console.error('Error in /api/auth/bootstrap GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone, mobilepayNumber, setupKey } = await req.json();

    // Check if a real production admin already exists
    const existingAdminRes = await query(
      `SELECT id, email FROM public.profiles WHERE role = 'admin' AND is_demo = false LIMIT 1`
    );
    const existingAdmin = existingAdminRes.rows[0];

    // If an admin already exists, enforce security check
    if (existingAdmin) {
      const emailCookie = req.cookies.get('circle_user_email')?.value || '';
      const actorRes = await query('SELECT role FROM public.profiles WHERE email = $1 LIMIT 1', [emailCookie]);
      const isAuthedAdmin = actorRes.rows[0]?.role === 'admin';
      const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
      const isValidKey = bootstrapSecret && setupKey === bootstrapSecret;

      if (!isAuthedAdmin && !isValidKey) {
        return NextResponse.json(
          {
            error: 'Security locked: A Super Administrator is already configured. Only an existing admin or valid setupKey can provision additional administrators.',
          },
          { status: 403 }
        );
      }
    }

    const targetEmail = email ? String(email).trim().toLowerCase() : '';

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid administrator email address.' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter a full name for the administrator.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Upsert real production admin profile
    const res = await query(
      `
      INSERT INTO public.profiles (
        id, email, full_name, role, status, is_demo, preferred_language, password_hash, phone, mobilepay_number, notes
      )
      VALUES (
        gen_random_uuid(), $1, $2, 'admin', 'active', false, 'en', $3, $4, $5, 'Production Super Administrator configured via bootstrap'
      )
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'admin',
        status = 'active',
        is_demo = false,
        password_hash = EXCLUDED.password_hash,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        mobilepay_number = COALESCE(EXCLUDED.mobilepay_number, public.profiles.mobilepay_number),
        updated_at = now()
      RETURNING id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language;
    `,
      [targetEmail, fullName.trim(), passwordHash, phone || null, mobilepayNumber || null]
    );

    const admin = res.rows[0];

    await logAuditEvent({
      action: 'ADMIN_BOOTSTRAP_COMPLETED',
      entityType: 'AUTH',
      entityId: admin.id,
      actorId: admin.id,
      actorEmail: admin.email,
      details: { event: 'Real production administrator provisioned securely' },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Production Super Administrator account provisioned successfully.',
      user: admin,
    });

    response.cookies.set('circle_user_email', admin.email, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/bootstrap POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
