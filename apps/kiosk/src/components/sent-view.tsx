'use client';

import { Button, formatCredits } from '@schoolcoin/ui';
import { useEffect } from 'react';

type Props = {
  amount: number;
  onDone: () => void;
};

export function SentView({ amount, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(() => {
      onDone();
    }, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-bg px-8 text-center fade-in">
      <div className="flex size-20 items-center justify-center rounded-full border border-success/25 bg-success-tint">
        <svg
          viewBox="0 0 24 24"
          className="size-10 text-success"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <p className="mt-8 text-3xl font-semibold tracking-tight text-ink-fg">
        Đã gửi yêu cầu {formatCredits(amount)}
      </p>
      <p className="mt-3 text-lg text-ink-muted">Phụ huynh sẽ nhận thông báo ngay</p>
      <div className="mt-10">
        <Button size="xl" variant="secondary" onClick={onDone}>
          Về trang chính
        </Button>
      </div>
    </div>
  );
}
