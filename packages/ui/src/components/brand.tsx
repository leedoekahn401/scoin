import { cn } from '../lib/cn';

/**
 * SchoolCoin mark: a pastel-gold coin with an embossed rim and a stylised
 * "S" path. Drawn in SVG so it is crisp at 20 px (sidebar) and 64 px (kiosk).
 */
export function CoinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7 shrink-0', className)} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="var(--color-brand)" />
      <circle
        cx="16"
        cy="16"
        r="11.25"
        fill="none"
        stroke="var(--color-brand-deep)"
        strokeOpacity="0.28"
        strokeWidth="1.25"
      />
      <path
        d="M19.6 12.2c-.6-1.1-1.9-1.8-3.6-1.8-2.1 0-3.6 1.1-3.6 2.7 0 3.6 7.4 2 7.4 5.9 0 1.7-1.6 2.9-3.9 2.9-1.8 0-3.2-.8-3.9-2.1"
        fill="none"
        stroke="var(--color-ink-fg)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M16 8.6v1.8M16 21.6v1.8"
        stroke="var(--color-ink-fg)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mark + wordmark, with an optional product label ("Căng tin", "Quản trị"). */
export function BrandMark({
  product,
  size = 'md',
  className,
}: {
  product?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const mark = { md: 'size-7', lg: 'size-9', xl: 'size-14' }[size];
  const word = { md: 'text-[1.0625rem]', lg: 'text-xl', xl: 'text-3xl' }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <CoinMark className={mark} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-semibold tracking-tight text-ink-fg', word)}>
          SchoolCoin
        </span>
        {product && <span className="mt-1 text-xs font-medium text-ink-muted">{product}</span>}
      </span>
    </span>
  );
}
