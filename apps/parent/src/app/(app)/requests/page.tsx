'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi } from '@schoolcoin/api-client/react';
import type { CreditRequest } from '@schoolcoin/types';
import {
  AmountPicker,
  Button,
  EmptyState,
  Field,
  LoadingBlock,
  Modal,
  Notice,
  PageHeader,
  PillToggle,
  Textarea,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircleHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { RequestCard } from '@/components/request-card';
import { queryKeys } from '@/lib/query-keys';

type Filter = 'pending' | 'all';

const FILTERS = [
  { value: 'pending', label: 'Đang chờ' },
  { value: 'all', label: 'Tất cả' },
] as const;

export default function RequestsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [approving, setApproving] = useState<CreditRequest | null>(null);
  const [declining, setDeclining] = useState<CreditRequest | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const requests = useQuery({
    queryKey: queryKeys.requests(filter === 'pending' ? 'PENDING' : undefined),
    queryFn: () =>
      api.parent.listRequests(filter === 'pending' ? { status: 'PENDING' } : undefined),
  });
  const settings = useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: () => api.publicSettings(),
  });

  function handleClosed(err: unknown): boolean {
    if (!isApiError(err, 'REQUEST_CLOSED')) return false;
    toast('Phụ huynh còn lại đã xử lý yêu cầu này');
    setApproving(null);
    setDeclining(null);
    void requests.refetch();
    return true;
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.requestsAll });
    void queryClient.invalidateQueries({ queryKey: queryKeys.topUps });
    void queryClient.invalidateQueries({ queryKey: queryKeys.children });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  }

  const approve = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      api.parent.approveRequest(id, credits),
    onSuccess: (checkout) => {
      toast.success('Đã đồng ý yêu cầu');
      setApproving(null);
      invalidate();
      router.push(`/topup/${checkout.id}`);
    },
    onError: (err) => {
      if (handleClosed(err)) return;
      toast.error(errorMessage(err));
    },
  });

  const decline = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.parent.declineRequest(id, { reason: note }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu');
      setDeclining(null);
      invalidate();
    },
    onError: (err) => {
      if (handleClosed(err)) return;
      toast.error(errorMessage(err));
    },
  });

  const min = settings.data?.topUpMinCredits ?? 10;
  const max = settings.data?.topUpMaxCredits ?? 2000;

  return (
    <>
      <PageHeader
        title="Yêu cầu xin xu"
        description="Con gửi yêu cầu ở kiosk, phụ huynh đồng ý hoặc từ chối tại đây."
      />

      <div className="flex flex-col gap-4">
        <PillToggle
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Lọc yêu cầu"
          layoutIdPrefix="requests-filter"
          size="lg"
        />

        {requests.isPending ? (
          <LoadingBlock className="min-h-64" />
        ) : requests.error ? (
          <Notice
            tone="danger"
            action={<Button onClick={() => void requests.refetch()}>Thử lại</Button>}
          >
            {errorMessage(requests.error)}
          </Notice>
        ) : !requests.data || requests.data.length === 0 ? (
          <EmptyState
            icon={<MessageCircleHeart />}
            title={
              filter === 'pending' ? 'Không có yêu cầu nào đang chờ' : 'Chưa có yêu cầu xin xu'
            }
            description="Yêu cầu mới từ kiosk sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {requests.data.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={(next) => {
                  setAmount(next.amountCredits);
                  setApproving(next);
                }}
                onDecline={(next) => {
                  setReason('');
                  setDeclining(next);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={approving !== null}
        onClose={() => setApproving(null)}
        title="Đồng ý và nạp xu"
        description="Bạn có thể đổi số xu trước khi tạo mã nạp."
        size="sm"
        closeDisabled={approve.isPending}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproving(null)} disabled={approve.isPending}>
              Hủy
            </Button>
            <Button
              data-primary
              variant="primary"
              loading={approve.isPending}
              disabled={approving === null || amount === null || amount < min || amount > max}
              onClick={() => {
                if (approving && amount !== null) {
                  approve.mutate({ id: approving.id, credits: amount });
                }
              }}
            >
              Tiếp tục
            </Button>
          </>
        }
      >
        <Field label="Số xu nạp">
          {() => (
            <AmountPicker
              presets={[50, 100, 200, 500]}
              value={amount}
              onChange={setAmount}
              min={min}
              max={max}
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={declining !== null}
        onClose={() => setDeclining(null)}
        title="Từ chối yêu cầu"
        description="Con sẽ thấy yêu cầu này bị từ chối ở kiosk."
        size="sm"
        closeDisabled={decline.isPending}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclining(null)} disabled={decline.isPending}>
              Hủy
            </Button>
            <Button
              data-primary
              variant="primary"
              loading={decline.isPending}
              onClick={() => {
                if (declining) decline.mutate({ id: declining.id, note: reason.trim() });
              }}
            >
              Từ chối
            </Button>
          </>
        }
      >
        <Field label="Lý do" optional hint="Con sẽ không thấy lý do này nếu bạn để trống">
          {(props) => (
            <Textarea
              {...props}
              value={reason}
              maxLength={200}
              placeholder="Ví dụ: nạp xu trực tiếp tại nhà"
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </Field>
      </Modal>
    </>
  );
}
