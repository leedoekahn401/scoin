'use client';

import type { TopUpCheckout } from '@schoolcoin/types';
import { KeyValue, Notice, formatCountdown, formatVnd, useCountdown } from '@schoolcoin/ui';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { CopyRow, CopyValue } from './copy-row';

export function TopUpQr({ checkout }: { checkout: TopUpCheckout }) {
  const [imageFailed, setImageFailed] = useState(false);
  const secondsLeft = useCountdown(checkout.expiresAt);

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <div className="flex flex-col items-center gap-3">
        <p className="font-display text-lg font-semibold tracking-tight text-ink-fg">
          Quét mã để chuyển khoản
        </p>
        <p className="text-[0.8125rem] text-ink-muted">Mở ứng dụng ngân hàng và quét mã VietQR</p>
        <div className="flex size-64 items-center justify-center rounded-[var(--ui-radius)] border border-border bg-surface-white p-2 shadow-[var(--ui-shadow-xs)]">
          {imageFailed ? (
            <QRCodeSVG value={checkout.paymentCode} size={240} level="M" />
          ) : (
            <img
              src={checkout.qrUrl}
              alt="Mã QR chuyển khoản"
              className="size-60"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Thông tin chuyển khoản"
        className="rounded-[var(--ui-radius)] border border-border bg-paper-bg px-2"
      >
        <KeyValue
          items={[
            { label: 'Ngân hàng', value: <CopyValue text={checkout.bank} label="ngân hàng" /> },
            {
              label: 'Số tài khoản',
              value: <CopyValue text={checkout.account} label="số tài khoản" mono />,
            },
            {
              label: 'Chủ tài khoản',
              value: <CopyValue text={checkout.holder} label="chủ tài khoản" />,
            },
            {
              label: 'Số tiền',
              value: <CopyValue text={formatVnd(checkout.amountVnd)} label="số tiền" mono />,
            },
          ]}
        />
        <div className="border-t border-border">
          <CopyRow label="Nội dung chuyển khoản" value={checkout.paymentCode} mono large emphasis />
        </div>
      </div>

      <Notice tone="warning">Giữ nguyên nội dung chuyển khoản để hệ thống tự cộng xu</Notice>

      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-muted">
        <span className="live-dot size-2 shrink-0 rounded-full bg-warning" aria-hidden />
        <span>Đang chờ chuyển khoản…</span>
        <span className="tabular">Mã hết hạn sau {formatCountdown(secondsLeft)}</span>
      </div>
    </div>
  );
}
