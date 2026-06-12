import { Skeleton } from '@/components/skeleton';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

const CARD_KEYS = Array.from({ length: 18 }, (_, i) => `card-${i}`);

export default async function HeroesLoading() {
  const t = getLabels(await getLocale());
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="pb-4 border-b border-(--color-border) space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton
          className="h-7 w-40"
          aria-label={t.heroes.loading}
        />
        <Skeleton className="h-3 w-72" />
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-44" />
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {CARD_KEYS.map((cardKey) => (
          <li key={cardKey}>
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          </li>
        ))}
      </ul>
    </div>
  );
}
