import { DEFAULT_LOCALE } from '@@shared';
import Link from 'next/link';
import { getLabels } from '@/lib/labels';

/**
 * /career/[playerId] notFound() trigger 시 표시. lang segment를 직접 못 받으므로 default locale 안내.
 * SEO는 robots noindex(부모 페이지에서 설정)와 무관하게 404 status 자체로 처리.
 */
export default function CareerNotFound() {
  const t = getLabels(DEFAULT_LOCALE);
  const copy = t.career.detail.notFound;

  return (
    <div className="space-y-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-text-muted)">{copy.kicker}</p>
      <h1 className="text-2xl font-extrabold text-(--color-text-strong)">{copy.heading}</h1>
      <p className="mx-auto max-w-md text-sm text-(--color-text-muted)">{copy.body}</p>
      <Link
        href={`/${DEFAULT_LOCALE}/career` as never}
        className="inline-block rounded-md border border-(--color-border-strong) px-4 py-2 text-sm font-semibold text-(--color-text) hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        {copy.cta}
      </Link>
    </div>
  );
}
