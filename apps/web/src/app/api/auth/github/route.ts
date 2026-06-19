import { NextResponse } from 'next/server';

import { apiBase } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GitHub OAuth 시작 — 백엔드 API의 /auth/github로 302.
 * 버튼이 `${WEB_API_BASE_URL}/auth/github`를 직접 가리키지 않게 BFF 라우트로 한 단계 감쌈 →
 * 공개 env (`NEXT_PUBLIC_API_BASE_URL`) 노출 없이 API 도메인 변경에 유연.
 */
export function GET(): NextResponse {
  return NextResponse.redirect(`${apiBase()}/auth/github`);
}
