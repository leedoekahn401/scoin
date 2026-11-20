'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { ChildDetail } from '@schoolcoin/types';
import {
  Badge,
  Button,
  CARD_STATUS,
  ConfirmDialog,
  EmptyState,
  LinkButton,
  LoadingBlock,
  Money,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  Tabs,
  errorMessage,
  formatCredits,
  formatDate,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { ChildTransactions } from '@/components/child-transactions';
import { ControlsForm } from '@/components/controls-form';
import { queryKeys } from '@/lib/query-keys';

type Tab = 'transactions' | 'controls' | 'card';

const TABS = [
  { value: 'transactions', label: 'Giao dịch' },
  { value: 'controls', label: 'Hạn mức & cảnh báo' },
  { value: 'card', label: 'Thẻ' },
] as const;

export default function ChildDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('transactions');
  const [lockOpen, setLockOpen] = useState(false);

  const child = useQuery({
    queryKey: queryKeys.child(studentId),
    queryFn: () => api.parent.getChild(studentId),
  });

  const lockCard = useMutation({
    mutationFn: () => api.parent.lockCard(studentId),
    onSuccess: () => {
      toast.success('Đã khóa thẻ');
      setLockOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.child(studentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.children });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (child.isPending) return <LoadingBlock className="min-h-80" />;
  if (child.error) {
    return (
      <Notice tone="danger" action={<Button onClick={() => void child.refetch()}>Thử lại</Button>}>
        {errorMessage(child.error)}
      </Notice>
    );
  }
  if (!child.data) {
    return <EmptyState title="Không tìm thấy thông tin học sinh" />;
  }

  const data: ChildDetail = child.data;

  return (
    <>
      <PageHeader
        back={{ href: '/', label: 'Các con' }}
        title={data.fullName}
        description={`${data.className} · ${data.studentCode}`}
      />

      <Panel className="mb-5 overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[0.8125rem] text-ink-muted">Số dư hiện tại</p>
            <Money credits={data.balanceCredits} size="hero" />
          </div>
          <div className="flex flex-col gap-1 text-[0.8125rem] text-ink-muted">
            <span className="tabular">Hôm nay đã tiêu {formatCredits(data.spentTodayCredits)}</span>
            <span className="tabular">
              Còn lại hôm nay{' '}
              {data.remainingTodayCredits === null
                ? 'không giới hạn'
                : formatCredits(data.remainingTodayCredits)}
            </span>
          </div>
          <LinkButton href={`/topup?studentId=${data.studentId}`} variant="primary" size="lg">
            Nạp xu
          </LinkButton>
        </div>
      </Panel>

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-5" />

      {tab === 'transactions' && <ChildTransactions studentId={data.studentId} />}
      {tab === 'controls' && <ControlsForm child={data} />}
      {tab === 'card' && <CardPanel child={data} onLockOpen={() => setLockOpen(true)} />}

      <ConfirmDialog
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onConfirm={() => lockCard.mutate()}
        title="Khóa thẻ"
        description={`Khóa thẻ của ${data.fullName}? Thẻ sẽ không dùng được ở căng tin và kiosk. Chỉ nhà trường cấp được thẻ mới.`}
        confirmLabel="Khóa thẻ"
        destructive
        loading={lockCard.isPending}
      />
    </>
  );
}

function CardPanel({ child, onLockOpen }: { child: ChildDetail; onLockOpen: () => void }) {
  if (!child.card) {
    return (
      <EmptyState
        icon={<CreditCard />}
        title="Chưa có thẻ được cấp"
        description="Liên hệ văn phòng nhà trường để được cấp thẻ cho con."
      />
    );
  }

  return (
    <Panel>
      <PanelHeader title="Thẻ học sinh" description="Thẻ dùng tại căng tin và kiosk" />
      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[0.8125rem] text-ink-muted">Trạng thái</p>
            <Badge tone={CARD_STATUS[child.card.status].tone}>
              {CARD_STATUS[child.card.status].label}
            </Badge>
          </div>
          <div>
            <p className="mb-1 text-[0.8125rem] text-ink-muted">Ngày cấp</p>
            <p className="text-sm tabular text-ink-fg">{formatDate(child.card.issuedAt)}</p>
          </div>
        </div>

        {child.card.status === 'ACTIVE' && (
          <Button variant="danger" size="lg" fullWidth onClick={onLockOpen}>
            Khóa thẻ ngay
          </Button>
        )}
        {child.card.status === 'LOCKED' && (
          <Notice tone="warning">Thẻ đã khóa. Liên hệ văn phòng để được cấp thẻ mới.</Notice>
        )}
        {child.card.status === 'REPLACED' && (
          <Notice tone="info">Thẻ đã được thay. Liên hệ văn phòng nếu con chưa có thẻ mới.</Notice>
        )}
      </div>
    </Panel>
  );
}
