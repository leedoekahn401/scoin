'use client';

import { Clock3, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button, Panel } from '@schoolcoin/ui';

export function TopUpClosed({
  variant,
  studentId,
}: {
  variant: 'EXPIRED' | 'CANCELLED';
  studentId: string;
}) {
  const router = useRouter();
  const expired = variant === 'EXPIRED';

  return (
    <Panel className="mx-auto max-w-md">
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-border bg-paper-bg text-ink-muted">
          {expired ? (
            <Clock3 className="size-8" aria-hidden />
          ) : (
            <XCircle className="size-8" aria-hidden />
          )}
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-fg">
          {expired ? 'Mã đã hết hạn' : 'Giao dịch đã hủy'}
        </h2>
        <p className="max-w-xs text-sm text-ink-muted">
          {expired
            ? 'Nếu bạn đã chuyển khoản, xu vẫn sẽ được cộng khi tiền về.'
            : 'Bạn có thể tạo mã mới để tiếp tục nạp xu cho con.'}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-3"
          onClick={() => router.push(`/topup?studentId=${studentId}`)}
        >
          Tạo mã mới
        </Button>
      </div>
    </Panel>
  );
}
