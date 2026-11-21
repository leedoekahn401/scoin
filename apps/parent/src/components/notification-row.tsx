'use client';

import type { Notification, NotificationType } from '@schoolcoin/types';
import { Landmark, Lock, MessageCircleHeart, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn, formatRelative } from '@schoolcoin/ui';

const ICONS: Record<NotificationType, ReactNode> = {
  TOPUP_PAID: <Landmark />,
  LOW_BALANCE: <TriangleAlert />,
  NEW_REQUEST: <MessageCircleHeart />,
  CARD_LOCKED: <Lock />,
};

export function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  const unread = notification.readAt === null;
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'workbook-press flex w-full items-start gap-3 border-b border-border px-4 py-4 text-left last:border-b-0 [&_svg]:size-5',
        unread ? 'bg-brand-tint/50' : 'bg-surface-white',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full border [&_svg]:size-[1.125rem]',
          unread
            ? 'border-brand/40 bg-brand-tint text-brand-deep'
            : 'border-border bg-paper-bg text-ink-muted',
        )}
      >
        {ICONS[notification.type]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-semibold text-ink-fg">{notification.title}</span>
          {unread && (
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
              aria-label="Chưa đọc"
            />
          )}
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-muted">
          {notification.body}
        </span>
        <span className="mt-1.5 block text-xs text-ink-muted">
          {formatRelative(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}
