import { timingSafeEqual } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const SECRET_HEADER = 'x-revalidate-secret';
const MAX_PATHS = 200;

interface RevalidateBody {
  paths?: unknown;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const expected = process.env.WEB_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'secret not configured' }, { status: 503 });
  }

  const provided = request.headers.get(SECRET_HEADER);
  if (!(provided && safeEqual(provided, expected))) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const paths = sanitizePaths(body.paths);
  if (paths.length === 0) {
    return NextResponse.json({ ok: false, error: 'no valid paths' }, { status: 400 });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}

function sanitizePaths(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed.startsWith('/')) {
      continue;
    }
    if (trimmed.includes('\n') || trimmed.includes('\r')) {
      continue;
    }
    unique.add(trimmed);
    if (unique.size >= MAX_PATHS) {
      break;
    }
  }
  return [...unique];
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
