interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

export function Skeleton({ className = '', 'aria-label': ariaLabel }: SkeletonProps) {
  const accessibilityProps = ariaLabel
    ? ({ 'aria-label': ariaLabel, role: 'status' } as const)
    : ({ 'aria-hidden': true } as const);

  return (
    <div
      {...accessibilityProps}
      className={`animate-pulse rounded bg-(--color-surface-hover) ${className}`}
    />
  );
}
