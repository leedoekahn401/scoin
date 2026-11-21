'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  Panel,
  PanelHeader,
  Stat,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatCredits,
  formatCreditsWithVnd,
  formatNumber,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

export function BalancesReport() {
  const api = useApi();
  const report = useQuery({
    queryKey: queryKeys.balances,
    queryFn: () => api.admin.balancesReport(),
  });

  if (report.isPending) return <LoadingBlock className="min-h-80" />;
  if (report.error) {
    return (
      <Notice
        tone="danger"
        action={
          <Button size="sm" onClick={() => void report.refetch()}>
            Thử lại
          </Button>
        }
      >
        {errorMessage(report.error)}
      </Notice>
    );
  }
  const data = report.data;
  if (!data || data.byClass.length === 0) {
    return <EmptyState title="Chưa có ví học sinh nào" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Stat
        emphasis
        label="Tổng số dư học sinh"
        value={formatCreditsWithVnd(data.totalOutstandingCredits)}
        sub={<span className="tabular">{formatNumber(data.walletCount)} ví đang lưu</span>}
        className="py-6"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Số dư theo lớp" />
          <Table>
            <THead>
              <tr>
                <TH>Lớp</TH>
                <TH align="right">Học sinh</TH>
                <TH align="right">Số dư</TH>
              </tr>
            </THead>
            <TBody>
              {data.byClass.map((row) => (
                <TR key={row.className}>
                  <TD className="font-medium">{row.className}</TD>
                  <TD align="right">{formatNumber(row.students)}</TD>
                  <TD align="right">{formatCredits(row.totalCredits)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>

        <Panel>
          <PanelHeader title="Số dư cao nhất" description="10 học sinh đầu bảng" />
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Lớp</TH>
                <TH align="right">Số dư</TH>
              </tr>
            </THead>
            <TBody>
              {data.top.length === 0 ? (
                <tr>
                  <td colSpan={3} className="!py-8 text-center text-sm text-ink-muted">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                data.top.map((row) => (
                  <TR key={row.studentId}>
                    <TD className="font-medium">{row.fullName}</TD>
                    <TD muted>{row.className}</TD>
                    <TD align="right">{formatCredits(row.balanceCredits)}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Panel>
      </div>
    </div>
  );
}
