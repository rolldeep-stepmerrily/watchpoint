import { NextResponse } from 'next/server';

import { fetchWithAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const apiRes = await fetchWithAuth('/users/me/bookmarks/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
