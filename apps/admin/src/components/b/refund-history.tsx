'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  Panel,
  PanelHeader,
  REFUND_METHOD,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatCredits,
  formatDateTime,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

export function RefundHistory() {
  const api = useApi();
  const refunds = useQuery({
    queryKey: queryKeys.refunds,
    queryFn: () => api.admin.listRefunds(),
  });

  return (
    <Panel className="lg:col-span-3">
      <PanelHeader title="Lịch sử hoàn tiền" description="Các khoản đã ghi nhận" />
      {refunds.isPending ? (
        <LoadingBlock />
      ) : refunds.error ? (
        <Notice
          tone="danger"
          className="m-5"
          action={
            <Button size="sm" onClick={() => void refunds.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(refunds.error)}
        </Notice>
      ) : !refunds.data || refunds.data.length === 0 ? (
        <EmptyState title="Chưa có lượt hoàn tiền" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Thời gian</TH>
              <TH>Học sinh</TH>
              <TH align="right">Số xu</TH>
              <TH>Phương thức</TH>
              <TH>Ghi chú</TH>
              <TH>Nhân viên</TH>
            </tr>
          </THead>
          <TBody>
            {refunds.data.map((refund) => (
              <TR key={refund.id}>
                <TD muted className="tabular">
                  {formatDateTime(refund.createdAt)}
                </TD>
                <TD className="font-medium">{refund.studentName}</TD>
                <TD align="right">{formatCredits(refund.amountCredits)}</TD>
                <TD muted>{REFUND_METHOD[refund.method]}</TD>
                <TD muted className="max-w-48 truncate">
                  {refund.note ?? '—'}
                </TD>
                <TD muted>{refund.createdByName}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Panel>
  );
}
