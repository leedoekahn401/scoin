import { cn } from '../lib/cn';
import { initials } from '../lib/format';
import { pastelFor, pastelStyle } from '../lib/pastel';

const SIZE = {
  xs: 'size-7 text-[0.6875rem]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-24 text-2xl',
  '2xl': 'size-32 text-4xl',
};

/**
 * Student/person avatar: the photo when there is one, otherwise initials on a
 * stable pastel from the bank. No ring, no shadow (DESIGN §2 Avatars).
 * POS uses `size="2xl"` so the cashier can check the face (UC-08 step 3).
 */
export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZE;
  shape?: 'circle' | 'rounded';
  className?: string;
}) {
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-[var(--ui-radius)]';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 object-cover', SIZE[size], radius, className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={pastelStyle(pastelFor(name))}
      className={cn(
        'pastel-tinted inline-flex shrink-0 select-none items-center justify-center font-display font-semibold text-[var(--pastel-ink)]',
        SIZE[size],
        radius,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
