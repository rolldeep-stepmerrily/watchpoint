export const SITE_NAME = 'Watchpoint';
export const SITE_DESCRIPTION = '오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적합니다.';

const RAW_URL = process.env.WEB_PUBLIC_URL ?? 'http://localhost:3001';

export const SITE_URL = RAW_URL.replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}
