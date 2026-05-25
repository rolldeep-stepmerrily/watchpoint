export const SITE_NAME = 'Watchpoint';

const RAW_URL = process.env.WEB_PUBLIC_URL ?? 'http://localhost:3001';

export const SITE_URL = RAW_URL.replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}
