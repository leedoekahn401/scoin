'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, can } from '@schoolcoin/types';
import {
  Badge,
  Button,
  EmptyState,
  LinkButton,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TOPUP_STATUS,
  errorMessage,
  formatDateTime,
  formatVnd,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCheck2 } from 'lucide-react';

import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { queryKeys } from '@/lib/query-keys';

export default function TopUpReviewPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.MANAGE_MONEY)) {
    return <ForbiddenNotice title="Kiểm tra nạp tiền" />;
  }
  return <TopUpReviewScreen />;
}

function TopUpReviewScreen() {
  const api = useApi();
  const queryClient = useQueryClient();

  const review = useQuery({
    queryKey: queryKeys.review,
    queryFn: () => api.admin.listTopUpsToReview(),
  });

  const markReviewed = useMutation({
    mutationFn: (id: string) => api.admin.markTopUpReviewed(id),
    onSuccess: () => {
      toast.success('Đã đánh dấu đã kiểm tra');
      void queryClient.invalidateQueries({ queryKey: queryKeys.review });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const items = review.data ?? [];

  return (
    <>
      <PageHeader
        title="Nạp cần kiểm tra"
        description="Đối chiếu số tiền thực nhận với yêu cầu nạp của phụ huynh."
      />

      {review.isPending ? (
        <LoadingBlock className="min-h-80" />
      ) : review.error ? (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void review.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(review.error)}
        </Notice>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 />}
          title="Không có giao dịch cần kiểm tra"
          description="Mọi khoản nạp đã được đối chiếu."
        />
      ) : (
        <Panel>
          <PanelHeader
            title="Danh sách cần kiểm tra"
            description={<span className="tabular">{items.length} giao dịch</span>}
          />
          <Table>
            <THead>
              <tr>
                <TH>Thời gian</TH>
                <TH>Học sinh</TH>
                <TH>Mã nạp</TH>
                <TH align="right">Yêu cầu</TH>
                <TH align="right">Đã nhận</TH>
                <TH align="right">Phần lẻ</TH>
                <TH>Trạng thái</TH>
                <TH align="right">Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((item) => {
                const received = item.transferAmountVnd;
                const lower = received !== null && received < item.amountVnd;
                const higher = received !== null && received > item.amountVnd;
                return (
                  <TR key={item.id}>
                    <TD muted className="tabular">
                      {formatDateTime(item.createdAt)}
                    </TD>
                    <TD>
                      <span className="font-medium">{item.studentName}</span>
                    </TD>
                    <TD className="font-mono text-xs">{item.paymentCode}</TD>
                    <TD align="right">{formatVnd(item.amountVnd)}</TD>
                    <TD align="right">
                      <span
                        className={lower ? 'text-danger' : higher ? 'text-success' : 'text-ink-fg'}
                      >
                        {received === null ? '—' : formatVnd(received)}
                      </span>
                    </TD>
                    <TD align="right" muted>
                      {item.remainderVnd === null ? '—' : formatVnd(item.remainderVnd)}
                    </TD>
                    <TD>
                      <Badge tone={TOPUP_STATUS[item.status].tone}>
                        {TOPUP_STATUS[item.status].label}
                      </Badge>
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end gap-1">
                        <LinkButton
                          href={`/money/refunds?studentId=${encodeURIComponent(item.studentId)}&tab=adjust`}
                          variant="ghost"
                          size="sm"
                        >
                          Điều chỉnh ví
                        </LinkButton>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={markReviewed.isPending && markReviewed.variables === item.id}
                          onClick={() => markReviewed.mutate(item.id)}
                        >
                          Đã kiểm tra
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Panel>
      )}
    </>
  );
}
