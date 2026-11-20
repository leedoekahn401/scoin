'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  Pagination,
  Panel,
  PanelHeader,
  TransactionList,
  errorMessage,
} from '@schoolcoin/ui';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export function StudentTransactionsPanel({ studentId }: { studentId: string }) {
  const api = useApi();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: queryKeys.studentTransactions(studentId, page),
    queryFn: () => api.admin.studentTransactions(studentId, { page, pageSize: 20 }),
  });

  return (
    <Panel className="lg:col-span-3">
      <PanelHeader title="Lịch sử ví" description="Các biến động số xu gần đây" />
      {query.isPending ? (
        <LoadingBlock />
      ) : query.error ? (
        <div className="px-5 py-5">
          <Notice
            tone="danger"
            action={
              <Button size="sm" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            }
          >
            {errorMessage(query.error)}
          </Notice>
        </div>
      ) : query.data.items.length === 0 ? (
        <EmptyState title="Chưa có giao dịch" />
      ) : (
        <>
          <div className="px-5 py-4">
            <TransactionList transactions={query.data.items} />
          </div>
          <Pagination page={page} pageSize={20} total={query.data.total} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}
