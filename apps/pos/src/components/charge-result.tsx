'use client';

import { Button, formatCredits } from '@schoolcoin/ui';
import { Check } from 'lucide-react';
import { useEffect } from 'react';

interface ChargeResultProps {
  totalCredits: number;
  studentName: string;
  balanceAfter: number;
  remainingToday: number | null;
  onNew: () => void;
}

export function ChargeResult({
  totalCredits,
  studentName,
  balanceAfter,
  remainingToday,
  onNew,
}: ChargeResultProps) {
  useEffect(() => {
    const t = window.setTimeout(onNew, 2500);
    return () => window.clearTimeout(t);
  }, [onNew]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface-white p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-success/25 bg-success-tint text-success">
        <Check className="size-10" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-display text-2xl font-semibold tracking-tight text-ink-fg">
          Đã thanh toán {formatCredits(totalCredits)}
        </p>
        <p className="text-sm text-ink-muted">{studentName}</p>
      </div>
      <div className="flex flex-col gap-1 text-sm text-ink-fg">
        <p>Số dư còn lại {formatCredits(balanceAfter)}</p>
        <p className="text-ink-muted">
          {remainingToday === null
            ? 'Không giới hạn chi tiêu'
            : `Hôm nay còn được tiêu ${formatCredits(remainingToday)}`}
        </p>
      </div>
      <Button variant="primary" size="lg" onClick={onNew}>
        Đơn mới
      </Button>
    </div>
  );
}
