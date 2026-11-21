import { CheckCircle2 } from 'lucide-react';

import { LinkButton, Panel, formatCredits } from '@schoolcoin/ui';

export function TopUpSuccess({
  credits,
  studentName,
  balanceAfter,
}: {
  credits: number;
  studentName: string;
  balanceAfter: number | null;
}) {
  return (
    <Panel className="mx-auto max-w-md">
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-success/25 bg-success-tint text-success">
          <CheckCircle2 className="size-8" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-fg">
            Đã nạp {formatCredits(credits)}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">cho {studentName}</p>
        </div>
        {balanceAfter !== null && (
          <p className="text-sm tabular text-ink-muted">Số dư mới: {formatCredits(balanceAfter)}</p>
        )}
        <LinkButton href="/" variant="primary" size="lg" className="mt-3">
          Về trang chính
        </LinkButton>
      </div>
    </Panel>
  );
}
