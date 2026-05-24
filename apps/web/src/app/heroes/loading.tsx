import { Skeleton } from '@/components/skeleton';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

const SECTION_KEYS = ['tank', 'damage', 'support'] as const;
const CARD_KEYS = Array.from({ length: 8 }, (_, i) => `card-${i}`);

export default async function HeroesLoading() {
  const t = getLabels(await getLocale());
  return (
    <div
      className="space-y-10"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton
        className="h-8 w-32"
        aria-label={t.heroes.loading}
      />
      {SECTION_KEYS.map((sectionKey) => (
        <section
          key={sectionKey}
          className="space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CARD_KEYS.map((cardKey) => (
              <Skeleton
                key={`${sectionKey}-${cardKey}`}
                className="h-24"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
