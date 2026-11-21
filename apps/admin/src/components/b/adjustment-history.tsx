'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  Panel,
  PanelHeader,
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

export function AdjustmentHistory() {
  const api = useApi();
  const adjustments = useQuery({
    queryKey: queryKeys.adjustments,
    queryFn: () => api.admin.listAdjustments(),
  });

  return (
    <Panel className="lg:col-span-3">
      <PanelHeader title="Lịch sử điều chỉnh" description="Các thay đổi số dư thủ công" />
      {adjustments.isPending ? (
        <LoadingBlock />
      ) : adjustments.error ? (
        <Notice
          tone="danger"
          className="m-5"
          action={
            <Button size="sm" onClick={() => void adjustments.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(adjustments.error)}
        </Notice>
      ) : !adjustments.data || adjustments.data.length === 0 ? (
        <EmptyState title="Chưa có lượt điều chỉnh" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Thời gian</TH>
              <TH>Học sinh</TH>
              <TH align="right">Số xu</TH>
              <TH>Lý do</TH>
              <TH>Nhân viên</TH>
            </tr>
          </THead>
          <TBody>
            {adjustments.data.map((adjustment) => (
              <TR key={adjustment.id}>
                <TD muted className="tabular">
                  {formatDateTime(adjustment.createdAt)}
                </TD>
                <TD className="font-medium">{adjustment.studentName}</TD>
                <TD align="right" className={adjustment.amountCredits > 0 ? 'text-success' : ''}>
                  {formatCredits(adjustment.amountCredits, { signed: true })}
                </TD>
                <TD muted className="max-w-64 truncate">
                  {adjustment.reason}
                </TD>
                <TD muted>{adjustment.createdByName}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Panel>
  );
}
