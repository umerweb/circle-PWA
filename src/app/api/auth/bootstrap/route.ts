import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const res = await query(
      `
      SELECT id, email, full_name, role, status, is_demo, created_at
      FROM public.profiles
      WHERE role = 'admin'
      LIMIT 1;
    `
    );

    const admin = res.rows[0] || null;

    return NextResponse.json({
      configured: Boolean(admin),
      adminEmail: admin ? admin.email : 'umer.web2@gmail.com',
      adminStatus: admin ? admin.status : 'not_configured',
    });
  } catch (error: any) {
    console.error('Error in /api/auth/bootstrap GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    const targetEmail = (email || 'umer.web2@gmail.com').trim().toLowerCase();

    // Verify target email is the authorized initial administrator
    if (targetEmail !== 'umer.web2@gmail.com') {
      return NextResponse.json(
        { error: 'Public registration is disabled. Only umer.web2@gmail.com is authorized as initial administrator.' },
        { status: 403 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // Upsert admin profile
    const res = await query(
      `
      INSERT INTO public.profiles (email, full_name, role, status, is_demo, preferred_language, notes)
      VALUES ($1, $2, 'admin', 'active', false, 'en', 'Initial Super Administrator configured via bootstrap')
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = 'admin',
        status = 'active',
        updated_at = now()
      RETURNING *;
    `,
      [targetEmail, fullName || 'Administrator (Umer)']
    );

    const admin = res.rows[0];

    await logAuditEvent({
      action: 'ADMIN_BOOTSTRAP_COMPLETED',
      entityType: 'AUTH',
      entityId: admin.id,
      actorId: admin.id,
      actorEmail: admin.email,
      details: { event: 'Administrator provisioned securely' },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Administrator account provisioned successfully.',
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
