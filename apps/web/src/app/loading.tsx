import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton
        className="h-8 w-48"
        aria-label="페이지 불러오는 중"
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
