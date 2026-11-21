import type { Transaction } from '@schoolcoin/types';
import {
  ArrowDownLeft,
  Banknote,
  Landmark,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { formatCredits, formatTime, formatWeekdayDate } from '../lib/format';
import { LEDGER_TYPE } from '../lib/labels';

const ICON: Record<Transaction['type'], ReactNode> = {
  TOPUP_SEPAY: <Landmark />,
  TOPUP_CASH: <Banknote />,
  PURCHASE: <ShoppingBag />,
  VOID_REVERSAL: <Undo2 />,
  REFUND: <ArrowDownLeft />,
  ADJUSTMENT: <SlidersHorizontal />,
};

/** What the row says: the items bought, or the ledger label. */
export function transactionTitle(tx: Transaction): string {
  if (tx.type === 'PURCHASE' && tx.items?.length) {
    return tx.items
      .map((i) => (i.quantity > 1 ? `${i.nameSnapshot} ×${i.quantity}` : i.nameSnapshot))
      .join(', ');
  }
  return LEDGER_TYPE[tx.type].label;
}

function TransactionRow({ tx, size }: { tx: Transaction; size: 'md' | 'lg' }) {
  const credit = tx.amountCredits > 0;
  return (
    <li className={cn('flex items-center gap-3', size === 'lg' ? 'py-4' : 'py-3')}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border',
          size === 'lg' ? 'size-12 [&_svg]:size-5' : 'size-9 [&_svg]:size-4',
          credit
            ? 'border-success/25 bg-success-tint text-success'
            : 'border-border bg-paper-bg text-ink-muted',
        )}
      >
        {tx.type === 'VOID_REVERSAL' ? <RotateCcw /> : ICON[tx.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn('truncate font-medium text-ink-fg', size === 'lg' ? 'text-lg' : 'text-sm')}
        >
          {transactionTitle(tx)}
        </p>
        <p
          className={cn(
            'truncate text-ink-muted',
            size === 'lg' ? 'text-base' : 'text-[0.8125rem]',
          )}
        >
          {formatTime(tx.createdAt)}
          {tx.type !== 'PURCHASE' && tx.note
            ? ` · ${tx.note}`
            : tx.type === 'PURCHASE'
              ? ` · ${LEDGER_TYPE.PURCHASE.label}`
              : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            'font-semibold tabular',
            size === 'lg' ? 'text-lg' : 'text-sm',
            credit ? 'text-success' : 'text-ink-fg',
          )}
        >
          {formatCredits(tx.amountCredits, { signed: true })}
        </p>
        <p className={cn('tabular text-ink-muted', size === 'lg' ? 'text-sm' : 'text-xs')}>
          Còn {formatCredits(tx.balanceAfter)}
        </p>
      </div>
    </li>
  );
}

/**
 * Ledger entries grouped by Vietnam day ("thứ Năm, 19/11"), newest first.
 * Shared by the parent app, kiosk (size="lg") and admin wallet history.
 */
export function TransactionList({
  transactions,
  size = 'md',
  groupByDay = true,
  className,
}: {
  transactions: Transaction[];
  size?: 'md' | 'lg';
  groupByDay?: boolean;
  className?: string;
}) {
  if (!groupByDay) {
    return (
      <ul className={cn('divide-y divide-border', className)}>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} size={size} />
        ))}
      </ul>
    );
  }
  const groups: { day: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const day = formatWeekdayDate(tx.createdAt);
    const last = groups.at(-1);
    if (last && last.day === day) last.items.push(tx);
    else groups.push({ day, items: [tx] });
  }
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {groups.map((g) => (
        <section key={g.day}>
          <h3
            className={cn(
              'font-medium capitalize text-ink-muted',
              size === 'lg' ? 'mb-1 text-base' : 'mb-0.5 text-xs',
            )}
          >
            {g.day}
          </h3>
          <ul className="divide-y divide-border">
            {g.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} size={size} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
