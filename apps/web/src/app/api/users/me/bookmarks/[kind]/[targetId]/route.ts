import { NextResponse } from 'next/server';

import { fetchWithAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Context {
  params: Promise<{ kind: string; targetId: string }>;
}

export async function DELETE(_request: Request, ctx: Context): Promise<NextResponse> {
  const { kind, targetId } = await ctx.params;
  const apiRes = await fetchWithAuth(
    `/users/me/bookmarks/${encodeURIComponent(kind)}/${encodeURIComponent(targetId)}`,
    { method: 'DELETE' },
  );

  if (apiRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
