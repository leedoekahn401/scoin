'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { TopUpCheckout, TopUpEvent } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  DEMO_TOOLS,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  TOPUP_STATUS,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TopUpClosed } from '@/components/topup-closed';
import { TopUpQr } from '@/components/topup-qr';
import { TopUpSuccess } from '@/components/topup-success';
import { queryKeys } from '@/lib/query-keys';

export default function TopUpDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const [terminalEvent, setTerminalEvent] = useState<TopUpEvent | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const topUp = useQuery({
    queryKey: queryKeys.topUp(id),
    queryFn: () => api.parent.getTopUp(id),
  });

  const studentId = topUp.data?.studentId;

  useEffect(() => {
    const unsubscribe = api.parent.subscribeTopUp(id, (event) => {
      setTerminalEvent(event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.children });
      void queryClient.invalidateQueries({ queryKey: queryKeys.topUps });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      if (studentId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.child(studentId) });
      }
    });
    return unsubscribe;
  }, [api, id, queryClient, studentId]);

  const cancel = useMutation({
    mutationFn: () => api.parent.cancelTopUp(id),
    onSuccess: () => {
      toast.success('Đã hủy giao dịch');
      setCancelOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.topUp(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.topUps });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const simulate = useMutation({
    mutationFn: (checkout: TopUpCheckout) =>
      api.dev.simulateTransfer({ amountVnd: checkout.amountVnd, content: checkout.paymentCode }),
    onSuccess: () => {
      toast.success('Đã ghi nhận chuyển khoản');
      void queryClient.invalidateQueries({ queryKey: queryKeys.topUp(id) });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (topUp.isPending) return <LoadingBlock className="min-h-80" />;
  if (topUp.error) {
    return (
      <Notice tone="danger" action={<Button onClick={() => void topUp.refetch()}>Thử lại</Button>}>
        {errorMessage(topUp.error)}
      </Notice>
    );
  }
  if (!topUp.data) return <Notice tone="warning">Không tìm thấy giao dịch nạp xu.</Notice>;

  const checkout = topUp.data;
  const status =
    terminalEvent?.type === 'PAID'
      ? 'PAID'
      : terminalEvent?.type === 'EXPIRED'
        ? 'EXPIRED'
        : checkout.status;

  return (
    <>
      <PageHeader
        back={{ href: '/', label: 'Các con' }}
        title="Nạp xu"
        description="Chuyển khoản đúng nội dung để hệ thống tự cộng xu."
      />

      {status === 'PAID' ? (
        <TopUpSuccess
          credits={
            terminalEvent?.type === 'PAID' ? terminalEvent.creditedCredits : checkout.amountCredits
          }
          studentName={checkout.studentName}
          balanceAfter={terminalEvent?.type === 'PAID' ? terminalEvent.balanceAfter : null}
        />
      ) : status === 'EXPIRED' ? (
        <TopUpClosed variant="EXPIRED" studentId={checkout.studentId} />
      ) : status === 'CANCELLED' ? (
        <TopUpClosed variant="CANCELLED" studentId={checkout.studentId} />
      ) : (
        <Panel className="mx-auto max-w-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
            <p className="font-display text-base font-semibold tracking-tight text-ink-fg">
              {checkout.studentName}
            </p>
            <Badge tone={TOPUP_STATUS[checkout.status].tone}>
              {TOPUP_STATUS[checkout.status].label}
            </Badge>
          </div>

          <TopUpQr checkout={checkout} />

          <div className="flex flex-col gap-2 border-t border-border bg-paper-bg/60 px-5 py-4 sm:flex-row">
            <Button variant="ghost" size="lg" fullWidth onClick={() => setCancelOpen(true)}>
              Hủy giao dịch
            </Button>
            {DEMO_TOOLS && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                loading={simulate.isPending}
                onClick={() => simulate.mutate(checkout)}
              >
                Giả lập chuyển khoản (demo)
              </Button>
            )}
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancel.mutate()}
        title="Hủy giao dịch"
        description="Bạn có chắc muốn hủy mã nạp này? Mã QR sẽ không còn hiệu lực."
        confirmLabel="Hủy giao dịch"
        destructive
        loading={cancel.isPending}
      />
    </>
  );
}
