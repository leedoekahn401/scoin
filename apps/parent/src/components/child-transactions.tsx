'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  PillToggle,
  TransactionList,
  errorMessage,
} from '@schoolcoin/ui';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

type Filter = 'all' | 'topup' | 'purchase';

const OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'topup', label: 'Nạp tiền' },
  { value: 'purchase', label: 'Mua hàng' },
] as const;

export function ChildTransactions({ studentId }: { studentId: string }) {
  const api = useApi();
  const [filter, setFilter] = useState<Filter>('all');

  const transactions = useInfiniteQuery({
    queryKey: queryKeys.transactions(studentId, { filter }),
    queryFn: ({ pageParam }) =>
      api.parent.listTransactions(studentId, { page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < Math.ceil(last.total / last.pageSize) ? last.page + 1 : undefined,
  });

  const items = (transactions.data?.pages.flatMap((page) => page.items) ?? []).filter((tx) => {
    if (filter === 'topup') return tx.type.startsWith('TOPUP_');
    if (filter === 'purchase') return tx.type === 'PURCHASE';
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <PillToggle
        options={OPTIONS}
        value={filter}
        onChange={setFilter}
        ariaLabel="Lọc giao dịch"
        layoutIdPrefix="child-transactions"
        size="lg"
        className="w-full sm:w-auto"
      />

      {transactions.isPending ? (
        <LoadingBlock className="min-h-56" />
      ) : transactions.error ? (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void transactions.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(transactions.error)}
        </Notice>
      ) : items.length === 0 && !transactions.hasNextPage ? (
        <EmptyState
          icon={<Receipt />}
          title="Chưa có giao dịch nào"
          description="Các lượt nạp xu và mua hàng sẽ xuất hiện tại đây."
        />
      ) : (
        <>
          <TransactionList transactions={items} />
          {transactions.hasNextPage && (
            <Button
              variant="secondary"
              fullWidth
              loading={transactions.isFetchingNextPage}
              onClick={() => void transactions.fetchNextPage()}
            >
              Xem thêm
            </Button>
          )}
        </>
      )}
    </div>
  );
}
