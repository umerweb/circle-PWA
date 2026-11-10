import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let sql = `
      SELECT a.*, p.full_name as actor_name
      FROM public.audit_logs a
      LEFT JOIN public.profiles p ON a.actor_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) {
      params.push(action);
      sql += ` AND a.action = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length};`;

    const res = await query(sql, params);

    return NextResponse.json({ logs: res.rows });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
