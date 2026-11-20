'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { CreditRequest, KioskMe } from '@schoolcoin/types';
import {
  Avatar,
  Badge,
  Button,
  LoadingBlock,
  Money,
  Notice,
  REQUEST_STATUS,
  TransactionList,
  errorMessage,
  formatCredits,
  formatRelative,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { HandCoins, LogOut } from 'lucide-react';

import { IdleSignOut, useKioskSignOut, useSignOutOnUnauthorized } from '@/components/kiosk-session';
import { queryKeys } from '@/lib/query-keys';

type Props = {
  onGoRequest: () => void;
};

/** The most recent request a parent answered, so the student learns the outcome (UC-06). */
function latestDecided(requests: CreditRequest[]): CreditRequest | null {
  const decided = requests.filter((r) => r.status === 'DECLINED' || r.status === 'PAID');
  decided.sort((a, b) => (b.decidedAt ?? b.createdAt).localeCompare(a.decidedAt ?? a.createdAt));
  return decided[0] ?? null;
}

export function useKioskMe() {
  const api = useApi();
  const query = useQuery({
    queryKey: queryKeys.kioskMe,
    queryFn: () => api.kiosk.me(),
    refetchOnWindowFocus: false,
  });
  useSignOutOnUnauthorized(query.error);
  return query;
}

function SpendingToday({ me }: { me: KioskMe }) {
  if (me.dailyLimitCredits === null) {
    return (
      <p className="text-lg text-ink-muted">
        Hôm nay đã tiêu {formatCredits(me.spentTodayCredits)}
      </p>
    );
  }
  const pct = Math.min(100, Math.round((me.spentTodayCredits / me.dailyLimitCredits) * 100));
  const left = Math.max(0, me.dailyLimitCredits - me.spentTodayCredits);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between text-lg">
        <span className="text-ink-fg">
          Hôm nay đã tiêu{' '}
          <span className="font-semibold tabular">{formatCredits(me.spentTodayCredits)}</span>
        </span>
        <span className="text-ink-muted tabular">còn {formatCredits(left)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-inset">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-base text-ink-muted">
        Hạn mức {formatCredits(me.dailyLimitCredits)} mỗi ngày
      </p>
    </div>
  );
}

export function HomeView({ onGoRequest }: Props) {
  const signOut = useKioskSignOut();
  const { data: me, isPending, error, refetch } = useKioskMe();
  const decided = me ? latestDecided(me.requests) : null;

  return (
    <div className="fade-in flex h-dvh flex-col bg-paper-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface-white px-8 py-4">
        <div className="flex items-center gap-4">
          <Avatar name={me?.fullName ?? ' '} src={me?.photoUrl} size="lg" />
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink-fg">
              {me?.fullName ?? '\u00a0'}
            </p>
            <p className="text-lg text-ink-muted">{me ? `Lớp ${me.className}` : '\u00a0'}</p>
          </div>
        </div>
        <Button size="xl" leadingIcon={<LogOut />} onClick={() => void signOut()}>
          Xong
        </Button>
      </header>

      {isPending ? (
        <LoadingBlock className="flex-1" />
      ) : error ? (
        <div className="p-8">
          <Notice tone="danger" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
            {errorMessage(error)}
          </Notice>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 p-8">
          <div className="flex min-h-0 flex-col gap-6">
            {decided && (
              <Notice
                tone={decided.status === 'PAID' ? 'success' : 'warning'}
                title={
                  decided.status === 'PAID'
                    ? `Phụ huynh đã nạp ${formatCredits(decided.amountCredits)} cho bạn`
                    : `Phụ huynh đã từ chối yêu cầu ${formatCredits(decided.amountCredits)}`
                }
              >
                {decided.status === 'DECLINED' && decided.declineReason
                  ? `“${decided.declineReason}”`
                  : undefined}
              </Notice>
            )}
            <section className="workbook-panel flex flex-col gap-6 p-7">
              <div>
                <p className="mb-3 text-lg font-medium text-ink-muted">Số dư của bạn</p>
                <Money credits={me.balanceCredits} size="hero" />
              </div>
              <SpendingToday me={me} />
            </section>
            <Button
              variant="primary"
              size="xl"
              fullWidth
              leadingIcon={<HandCoins />}
              onClick={onGoRequest}
            >
              Xin phụ huynh thêm xu
            </Button>
            {me.requests.length > 0 && (
              <section className="workbook-panel min-h-0 flex-1 overflow-hidden">
                <h2 className="border-b border-border px-6 py-3.5 text-lg font-semibold text-ink-fg">
                  Yêu cầu 7 ngày qua
                </h2>
                <ul className="workbook-scrollbar max-h-full divide-y divide-border overflow-y-auto px-6">
                  {me.requests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-lg font-semibold tabular text-ink-fg">
                        {formatCredits(r.amountCredits)}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-base text-ink-muted">
                          {formatRelative(r.createdAt)}
                        </span>
                        <Badge tone={REQUEST_STATUS[r.status].tone}>
                          {REQUEST_STATUS[r.status].label}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <section className="workbook-panel flex min-h-0 flex-col overflow-hidden">
            <h2 className="shrink-0 border-b border-border px-6 py-4 text-lg font-semibold text-ink-fg">
              10 giao dịch gần nhất
            </h2>
            <div className="workbook-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-3">
              {me.transactions.length === 0 ? (
                <p className="py-10 text-center text-lg text-ink-muted">Chưa có giao dịch nào</p>
              ) : (
                <TransactionList size="lg" transactions={me.transactions} />
              )}
            </div>
          </section>
        </div>
      )}
      <IdleSignOut />
    </div>
  );
}
