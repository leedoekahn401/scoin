'use client';

import { BrandMark, Button } from '@schoolcoin/ui';
import { useEffect } from 'react';

type Props = {
  message: string;
  onBack: () => void;
};

export function MessageView({ message, onBack }: Props) {
  useEffect(() => {
    const t = setTimeout(() => {
      onBack();
    }, 5000);
    return () => clearTimeout(t);
  }, [onBack]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-bg px-8 text-center fade-in">
      <BrandMark size="xl" />
      <p className="mt-10 max-w-3xl text-2xl font-semibold text-ink-fg">{message}</p>
      <div className="mt-10">
        <Button size="xl" variant="secondary" onClick={onBack}>
          Quay lại
        </Button>
      </div>
      <p className="mt-6 text-sm text-ink-muted">Tự động quay về sau 5 giây</p>
    </div>
  );
}
