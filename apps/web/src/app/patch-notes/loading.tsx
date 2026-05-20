import { Skeleton } from '@/components/skeleton';

const ROW_KEYS = Array.from({ length: 6 }, (_, i) => `row-${i}`);

export default function PatchNotesLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton
        className="h-8 w-40"
        aria-label="패치노트 목록 불러오는 중"
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
