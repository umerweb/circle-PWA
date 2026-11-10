import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let targetEmail = 'umer.web2@gmail.com';
    if (role === 'collector') {
      targetEmail = 'demo.member1@circlefund.internal';
    } else if (role === 'member') {
      targetEmail = 'demo.member2@circlefund.internal';
    }

    const res = await query(
      `
      SELECT id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language
      FROM public.profiles
      WHERE email = $1
      LIMIT 1;
    `,
      [targetEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Target persona not found' }, { status: 404 });
    }

    const row = res.rows[0];
    const user = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      phone: row.phone,
      mobilepayNumber: row.mobilepay_number,
      isDemo: row.is_demo,
      preferredLanguage: row.preferred_language,
    };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('circle_user_email', user.email, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/switch-role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
