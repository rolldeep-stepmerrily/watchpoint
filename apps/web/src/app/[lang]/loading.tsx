import { DEFAULT_LOCALE } from '@@shared';
import { Skeleton } from '@/components/skeleton';
import { getLabels } from '@/lib/labels';

export default function Loading() {
  const t = getLabels(DEFAULT_LOCALE);
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton
        className="h-8 w-48"
        aria-label={t.common.pageLoading}
      />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
