import { NextResponse } from 'next/server';

import { fetchWithAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const apiRes = await fetchWithAuth('/users/me/password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

  if (apiRes.status === 200 || apiRes.status === 204) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
