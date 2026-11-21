import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '../lib/cn';
import { formatNumber } from '../lib/format';

/**
 * Table primitives over the `workbook-table` look: quiet paper header band,
 * hairline row rules, paper hover. Wrap in a Panel; the wrapper scrolls
 * horizontally so a wide table never widens the page.
 */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="workbook-scrollbar w-full overflow-x-auto">
      <table className={cn('workbook-table', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  className,
  onClick,
  selected,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        onClick && 'cursor-pointer',
        selected && 'bg-brand-tint hover:!bg-brand-tint',
        className,
      )}
      onClick={onClick}
      {...props}
    />
  );
}

export function TH({
  className,
  align = 'left',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={cn(
        align === 'right' && '!text-right',
        align === 'center' && '!text-center',
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align = 'left',
  muted,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right' | 'center';
  muted?: boolean;
}) {
  return (
    <td
      className={cn(
        align === 'right' && 'whitespace-nowrap text-right tabular',
        align === 'center' && 'text-center',
        muted ? 'text-ink-muted' : 'text-ink-fg',
        className,
      )}
      {...props}
    />
  );
}

/** Row shown when a table has no data, spanning every column. */
export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="!py-10 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5 text-[0.8125rem] text-ink-muted">
      <span className="tabular">
        {formatNumber(from)}–{formatNumber(to)} trên {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="workbook-press flex size-8 items-center justify-center rounded-[var(--ui-radius-sm)] hover:bg-paper-bg hover:text-ink-fg disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="tabular px-1">
          {page}/{pages}
        </span>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="workbook-press flex size-8 items-center justify-center rounded-[var(--ui-radius-sm)] hover:bg-paper-bg hover:text-ink-fg disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
