import { cn, formatNumber } from '@schoolcoin/ui';

export function BalanceProgress({
  spent,
  limit,
  className,
}: {
  spent: number;
  limit: number | null;
  className?: string;
}) {
  if (limit === null) {
    return (
      <p className={cn('text-[0.8125rem] tabular text-ink-muted', className)}>
        Hôm nay đã tiêu {formatNumber(spent)} xu
      </p>
    );
  }

  const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2 text-[0.8125rem] tabular text-ink-muted">
        <span>
          Hôm nay {formatNumber(spent)}/{formatNumber(limit)} xu
        </span>
        <span>{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Chi tiêu hôm nay"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={spent}
        className="h-1.5 w-full overflow-hidden rounded-[var(--ui-radius-sm)] bg-surface-inset"
      >
        <div
          className="h-full rounded-[var(--ui-radius-sm)] bg-brand"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
