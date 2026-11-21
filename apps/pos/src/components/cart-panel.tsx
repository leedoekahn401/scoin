'use client';

import { Button, formatCredits, formatNumber, creditsToVnd } from '@schoolcoin/ui';
import { KeyRound, Minus, Plus, TriangleAlert } from 'lucide-react';

import type { CartLine } from './use-cart';

interface CartPanelProps {
  lines: CartLine[];
  totalCredits: number;
  onSetQty: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
  onClear: () => void;
  balance: number | null;
  remainingToday: number | null;
  pinThreshold: number;
  canCharge: boolean;
  onCharge: () => void;
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="workbook-press flex size-12 items-center justify-center rounded-[var(--ui-radius-sm)] border border-border-strong bg-surface-white text-ink-fg hover:bg-paper-bg active:bg-brand-tint"
    >
      {children}
    </button>
  );
}

/** Cart lines, totals and the one gold "charge" action (FR-POS-02). */
export function CartPanel({
  lines,
  totalCredits,
  onSetQty,
  onClear,
  balance,
  remainingToday,
  pinThreshold,
  canCharge,
  onCharge,
}: CartPanelProps) {
  const insufficient = balance !== null && totalCredits > balance;
  const overDaily = remainingToday !== null && totalCredits > remainingToday;
  const needsPin = totalCredits > pinThreshold;
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-5">
        <p className="text-sm font-semibold text-ink-fg">
          Giỏ hàng
          {itemCount > 0 && (
            <span className="ml-1.5 font-normal text-ink-muted tabular">· {itemCount} món</span>
          )}
        </p>
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Xóa tất cả
          </Button>
        )}
      </div>

      <div className="workbook-scrollbar min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            Chạm vào món ở bên trái để thêm vào giỏ
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <li key={line.menuItemId} className="flex items-center gap-3 px-5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-fg">{line.name}</p>
                  <p className="text-[0.8125rem] tabular text-ink-muted">
                    {formatCredits(line.unitPriceCredits * line.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StepButton
                    label={`Bớt một ${line.name}`}
                    onClick={() => onSetQty(line.menuItemId, line.quantity - 1)}
                  >
                    <Minus className="size-4" />
                  </StepButton>
                  <span className="w-8 text-center text-base font-semibold tabular text-ink-fg">
                    {line.quantity}
                  </span>
                  <StepButton
                    label={`Thêm một ${line.name}`}
                    onClick={() => onSetQty(line.menuItemId, line.quantity + 1)}
                  >
                    <Plus className="size-4" />
                  </StepButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-surface-white px-5 pb-5 pt-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <span className="text-sm text-ink-muted">Tổng cộng</span>
          <span className="text-right">
            <span className="block font-display text-3xl font-semibold leading-none tracking-tight tabular text-ink-fg">
              {formatNumber(totalCredits)}
              <span className="ml-1 font-sans text-lg font-medium text-ink-muted">xu</span>
            </span>
            <span className="mt-1 block text-sm tabular text-ink-muted">
              {creditsToVnd(totalCredits)}
            </span>
          </span>
        </div>
        <div className="mb-3 flex min-h-5 flex-col gap-1 text-[0.8125rem]">
          {totalCredits > 0 && insufficient && balance !== null && (
            <p className="flex items-center gap-1.5 font-medium text-danger">
              <TriangleAlert className="size-3.5" /> Không đủ xu: số dư {formatCredits(balance)}
            </p>
          )}
          {totalCredits > 0 && !insufficient && overDaily && remainingToday !== null && (
            <p className="flex items-center gap-1.5 font-medium text-warning-ink">
              <TriangleAlert className="size-3.5" /> Vượt hạn mức: hôm nay chỉ còn{' '}
              {formatCredits(remainingToday)}
            </p>
          )}
          {totalCredits > 0 && needsPin && (
            <p className="flex items-center gap-1.5 text-ink-muted">
              <KeyRound className="size-3.5" /> Đơn trên {formatCredits(pinThreshold)} cần học sinh
              nhập mã PIN
            </p>
          )}
        </div>
        <Button variant="primary" size="xl" fullWidth onClick={onCharge} disabled={!canCharge}>
          {totalCredits > 0 ? `Thu ${formatCredits(totalCredits)}` : 'Thu tiền'}
        </Button>
      </div>
    </div>
  );
}
