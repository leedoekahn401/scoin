'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button';

/**
 * A navigation link that looks like a Button. Use this instead of wrapping
 * <Button> in <Link> — a button inside an anchor is invalid HTML.
 */
export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size, fullWidth), className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
