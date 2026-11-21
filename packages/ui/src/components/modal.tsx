'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import { Button } from './button';
import { Field, Textarea } from './form';

/**
 * The shared centred dialog, ported from ronansat's ModalDialog: portaled to
 * <body>, flat dim (never blurred), Escape + backdrop close, scrolling body,
 * pinned footer, full-screen sheet below `sm`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  closeDisabled = false,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closeDisabled) onClose();
    };
    window.addEventListener('keydown', onKey);
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    // Move focus into the dialog so keyboard users land inside it.
    const t = window.setTimeout(() => {
      const target = cardRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], input:not([type=hidden]), textarea, select, button[data-primary]',
      );
      target?.focus();
    }, 30);
    return () => {
      window.removeEventListener('keydown', onKey);
      body.style.overflow = previous;
      window.clearTimeout(t);
    };
  }, [open, onClose, closeDisabled]);

  if (!open || typeof document === 'undefined') return null;

  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[
    size
  ];

  return createPortal(
    <div
      className="workbook-modal-backdrop fade-in fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4"
      role="presentation"
      onMouseDown={closeDisabled ? undefined : onClose}
    >
      <section
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'workbook-modal-card menu-pop flex h-full max-h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[min(90vh,46rem)]',
          width,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-fg">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Đóng"
            className="workbook-press -mr-1 flex size-8 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-muted hover:bg-paper-bg hover:text-ink-fg disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="workbook-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-paper-bg px-5 py-3">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}

/**
 * Confirm a consequential action. With `reasonLabel` it also collects a
 * required reason (void an order, ignore a payment).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  destructive,
  loading,
  reasonLabel,
  reasonPlaceholder,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);
  const needsReason = Boolean(reasonLabel);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeDisabled={loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            data-primary
            variant={destructive ? 'danger' : 'primary'}
            loading={loading}
            disabled={needsReason && reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {description && <p className="text-sm text-ink-muted">{description}</p>}
        {children}
        {needsReason && (
          <Field label={reasonLabel}>
            {(p) => (
              <Textarea
                {...p}
                value={reason}
                maxLength={200}
                placeholder={reasonPlaceholder}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </Field>
        )}
      </div>
    </Modal>
  );
}
