'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  BrandMark,
  CoinMark,
  DEMO_TOOLS,
  formatTime,
  formatWeekdayDate,
  useCardScanner,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

type Props = {
  onScanned: (cardCode: string) => void;
};

/** Live clock. Starts empty so server and client render the same markup. */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute right-8 top-7 text-right">
      <p className="font-display text-2xl font-semibold tabular text-ink-fg">
        {now ? formatTime(now) : '\u00a0'}
      </p>
      <p className="text-base text-ink-muted">{now ? formatWeekdayDate(now) : '\u00a0'}</p>
    </div>
  );
}

export function IdleView({ onScanned }: Props) {
  const api = useApi();
  useCardScanner(onScanned);

  const demoCards = useQuery({
    queryKey: queryKeys.demoCards,
    queryFn: () => api.dev.demoCards(),
    enabled: DEMO_TOOLS,
    staleTime: Infinity,
  });

  return (
    <div className="fade-in relative flex h-dvh flex-col items-center justify-center bg-paper-bg px-8">
      <div className="absolute left-8 top-7">
        <BrandMark product="Kiosk học sinh" size="lg" />
      </div>
      <Clock />

      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        {/* Student card silhouette with a gold scan line passing over it. */}
        <div className="relative h-52 w-80 overflow-hidden rounded-[var(--ui-radius-lg)] border border-border-strong bg-surface-white shadow-[var(--ui-shadow-md)]">
          <div className="flex h-full flex-col justify-between p-5 text-left">
            <div className="flex items-center gap-2">
              <CoinMark className="size-6" />
              <span className="font-display text-sm font-semibold text-ink-fg">SchoolCoin</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <span className="h-2.5 w-28 rounded-full bg-surface-inset" />
                <span className="h-2.5 w-16 rounded-full bg-surface-inset" />
              </div>
              <div className="grid size-20 grid-cols-4 gap-1 rounded-[var(--ui-radius-sm)] border border-border p-1.5">
                {Array.from({ length: 16 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      (i * 7) % 3 === 0
                        ? 'rounded-[2px] bg-ink-fg/80'
                        : 'rounded-[2px] bg-surface-inset'
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="scan-line absolute inset-x-0 top-0 h-0.5 bg-brand shadow-[0_0_16px_4px_var(--color-brand)]" />
        </div>

        <h1 className="mt-12 font-display text-4xl font-semibold tracking-tight text-ink-fg">
          Quét thẻ học sinh để bắt đầu
        </h1>
        <p className="mt-3 text-xl text-ink-muted">Đưa mã QR trên thẻ vào máy quét</p>
      </div>

      {DEMO_TOOLS && demoCards.data && demoCards.data.length > 0 && (
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
          <p className="text-sm text-ink-muted">
            Thẻ demo — chạm để giả lập quét thẻ (mã PIN 1234)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {demoCards.data.slice(0, 6).map((c) => (
              <button
                key={c.cardCode}
                type="button"
                onClick={() => onScanned(c.cardCode)}
                className="workbook-press h-12 rounded-[var(--ui-radius)] border border-border bg-surface-white px-4 text-base font-medium text-ink-fg shadow-[var(--ui-shadow-xs)] hover:bg-paper-bg"
              >
                {c.fullName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
