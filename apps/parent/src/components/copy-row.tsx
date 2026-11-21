'use client';

import { Copy } from 'lucide-react';

import { IconButton, cn, toast } from '@schoolcoin/ui';

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success('Đã sao chép');
  } catch {
    toast.error('Không sao chép được, vui lòng thử lại');
  }
}

export function CopyValue({
  text,
  label,
  mono = false,
  large = false,
  emphasis = false,
}: {
  text: string;
  label: string;
  mono?: boolean;
  large?: boolean;
  emphasis?: boolean;
}) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span
        className={cn(
          'font-medium tabular text-ink-fg',
          mono && 'font-mono',
          large && 'text-base font-semibold',
          emphasis && 'text-brand-deep',
        )}
      >
        {text}
      </span>
      <IconButton label={`Sao chép ${label}`} size="sm" onClick={() => void copyText(text)}>
        <Copy />
      </IconButton>
    </span>
  );
}

export function CopyRow({
  label,
  value,
  mono = false,
  large = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5 text-sm',
        emphasis && 'bg-brand-tint px-3',
      )}
    >
      <span className={cn('shrink-0 text-ink-muted', emphasis && 'font-medium text-brand-deep')}>
        {label}
      </span>
      <CopyValue
        text={value}
        label={label.toLowerCase()}
        mono={mono}
        large={large}
        emphasis={emphasis}
      />
    </div>
  );
}
