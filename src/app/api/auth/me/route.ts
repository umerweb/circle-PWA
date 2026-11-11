import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const emailCookie = req.cookies.get('circle_user_email')?.value;

    if (!emailCookie) {
      return NextResponse.json({ user: null });
    }

    const res = await query(
      `
      SELECT id, email, full_name, role, status, phone, mobilepay_number, is_demo, preferred_language
      FROM public.profiles
      WHERE LOWER(email) = $1
      LIMIT 1;
    `,
      [emailCookie.trim().toLowerCase()]
    );

    if (res.rows.length === 0) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('circle_user_email');
      return response;
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
      isDemo: Boolean(row.is_demo || row.email === 'umer.web2@gmail.com'),
      preferredLanguage: row.preferred_language,
    };

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
