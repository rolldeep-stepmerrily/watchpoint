import { NextResponse } from 'next/server';

import { fetchWithAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  const apiRes = await fetchWithAuth(`/users/me/bookmarks${query}`);
  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const apiRes = await fetchWithAuth('/users/me/bookmarks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
