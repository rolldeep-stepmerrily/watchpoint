import { Skeleton } from '@/components/skeleton';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

const ROW_KEYS = Array.from({ length: 6 }, (_, i) => `row-${i}`);

export default async function PatchNotesLoading() {
  const t = getLabels(await getLocale());
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton
        className="h-8 w-40"
        aria-label={t.patchNotes.loading}
      />
      <ul className="space-y-3">
        {ROW_KEYS.map((rowKey) => (
          <li key={rowKey}>
            <Skeleton className="h-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
