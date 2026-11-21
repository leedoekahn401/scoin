'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { SepayTransaction } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import {
  Button,
  ConfirmDialog,
  DEMO_TOOLS,
  PageHeader,
  PillToggle,
  formatVnd,
  toast,
  errorMessage,
  type PillOption,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { UnmatchedAssignDialog } from '@/components/b/unmatched-assign-dialog';
import { UnmatchedSimulateDialog } from '@/components/b/unmatched-simulate-dialog';
import { UnmatchedTable } from '@/components/b/unmatched-table';
import { queryKeys } from '@/lib/query-keys';

type StatusFilter = 'UNMATCHED' | 'RESOLVED' | 'IGNORED' | 'ALL';

export default function UnmatchedPaymentsPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.MANAGE_MONEY)) {
    return <ForbiddenNotice title="Giao dịch chuyển khoản" />;
  }
  return <UnmatchedScreen />;
}

function UnmatchedScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('UNMATCHED');
  const [assigning, setAssigning] = useState<SepayTransaction | null>(null);
  const [ignoring, setIgnoring] = useState<SepayTransaction | null>(null);
  const [simulating, setSimulating] = useState(false);

  const dashboard = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.admin.dashboard(),
  });

  const payments = useQuery({
    queryKey: queryKeys.sepay({ status }),
    queryFn: () =>
      api.admin.listSepayTransactions({
        status: status === 'ALL' ? undefined : status,
        pageSize: 100,
      }),
  });

  function invalidatePayments() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.sepayAll });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }

  const assign = useMutation({
    mutationFn: ({ id, studentId, note }: { id: string; studentId: string; note?: string }) =>
      api.admin.assignPayment(id, { studentId, note }),
    onSuccess: () => {
      toast.success('Đã gán khoản chuyển khoản cho học sinh');
      invalidatePayments();
      setAssigning(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const ignore = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.admin.ignorePayment(id, { reason }),
    onSuccess: () => {
      toast.success('Đã bỏ qua giao dịch');
      invalidatePayments();
      setIgnoring(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const simulate = useMutation({
    mutationFn: ({ amountVnd, content }: { amountVnd: number; content: string }) =>
      api.dev.simulateTransfer({ amountVnd, content }),
    onSuccess: () => {
      toast.success('Đã tạo chuyển khoản giả lập');
      invalidatePayments();
      setSimulating(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const statusOptions: readonly PillOption<StatusFilter>[] = [
    {
      value: 'UNMATCHED',
      label: 'Chưa khớp',
      count: dashboard.data?.unmatchedPayments,
    },
    { value: 'RESOLVED', label: 'Đã gán' },
    { value: 'IGNORED', label: 'Bỏ qua' },
    { value: 'ALL', label: 'Tất cả' },
  ];

  return (
    <>
      <PageHeader
        title="Giao dịch chuyển khoản"
        description="Đối chiếu các khoản SePay với mã nạp của học sinh."
        actions={
          DEMO_TOOLS ? (
            <Button variant="secondary" onClick={() => setSimulating(true)}>
              Giả lập chuyển khoản (demo)
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6">
        <PillToggle
          options={statusOptions}
          value={status}
          onChange={setStatus}
          ariaLabel="Lọc theo trạng thái giao dịch"
          layoutIdPrefix="sepay-status"
        />

        <UnmatchedTable
          items={payments.data?.items ?? []}
          pending={payments.isPending}
          error={payments.error}
          onRetry={() => void payments.refetch()}
          onAssign={setAssigning}
          onIgnore={setIgnoring}
        />
      </div>

      {assigning && (
        <UnmatchedAssignDialog
          tx={assigning}
          pending={assign.isPending}
          onClose={() => setAssigning(null)}
          onConfirm={(studentId, note) => assign.mutate({ id: assigning.id, studentId, note })}
        />
      )}

      <ConfirmDialog
        open={ignoring !== null}
        onClose={() => setIgnoring(null)}
        onConfirm={(reason) => {
          if (!ignoring) return;
          ignore.mutate({ id: ignoring.id, reason });
        }}
        title="Bỏ qua giao dịch"
        description={
          ignoring ? (
            <span className="tabular">
              Khoản {formatVnd(ignoring.transferAmountVnd)} sẽ không được cộng xu.
            </span>
          ) : undefined
        }
        confirmLabel="Bỏ qua"
        destructive
        loading={ignore.isPending}
        reasonLabel="Lý do bỏ qua"
        reasonPlaceholder="Ví dụ: học phí, không phải SchoolCoin"
      />

      {simulating && (
        <UnmatchedSimulateDialog
          pending={simulate.isPending}
          onClose={() => setSimulating(false)}
          onSimulate={(amountVnd, content) => simulate.mutate({ amountVnd, content })}
        />
      )}
    </>
  );
}
