'use client';

import type { ChildSummary } from '@schoolcoin/types';
import { Avatar, Badge, CARD_STATUS, LinkButton, Money, Panel, cn } from '@schoolcoin/ui';
import Link from 'next/link';

import { BalanceProgress } from './balance-progress';

export function ChildCard({ child }: { child: ChildSummary }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-5">
        <Avatar name={child.fullName} src={child.photoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold tracking-tight text-ink-fg">
                {child.fullName}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{child.className}</p>
            </div>
            {child.cardStatus && child.cardStatus !== 'ACTIVE' && (
              <Badge tone={CARD_STATUS[child.cardStatus].tone}>
                {CARD_STATUS[child.cardStatus].label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[0.8125rem] text-ink-muted">Số dư hiện tại</p>
            <Money credits={child.balanceCredits} size="lg" />
          </div>
          {child.pendingRequests > 0 && (
            <Link
              href="/requests"
              className={cn('workbook-press rounded-[var(--ui-radius-sm)]')}
              aria-label={`${child.pendingRequests} yêu cầu xin xu của ${child.fullName}`}
            >
              <Badge tone="warning" dot>
                {child.pendingRequests} yêu cầu xin xu
              </Badge>
            </Link>
          )}
        </div>
        <BalanceProgress spent={child.spentTodayCredits} limit={child.dailyLimitCredits} />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border bg-paper-bg/60 px-5 py-4">
        <LinkButton
          href={`/topup?studentId=${child.studentId}`}
          variant="primary"
          size="lg"
          fullWidth
        >
          Nạp xu
        </LinkButton>
        <LinkButton href={`/children/${child.studentId}`} variant="secondary" size="lg" fullWidth>
          Chi tiết
        </LinkButton>
      </div>
    </Panel>
  );
}
