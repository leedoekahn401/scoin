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
  formatShortDay,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';

import { BarSeriesChart } from '@/components/bar-series-chart';
import { queryKeys } from '@/lib/query-keys';

export function TopUpsReport({ from, to }: { from: string; to: string }) {
  const api = useApi();
  const report = useQuery({
    queryKey: queryKeys.topups(from, to),
    queryFn: () => api.admin.topUpReport({ from, to }),
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
  if (!data || data.byDay.length === 0) {
    return <EmptyState title="Không có lượt nạp trong khoảng này" />;
  }
  const sepay = data.byMethod.find((row) => row.method === 'SEPAY');
  const cash = data.byMethod.find((row) => row.method === 'CASH');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          emphasis
          label="Chuyển khoản SePay"
          value={formatCredits(sepay?.totalCredits ?? 0)}
          sub={<span className="tabular">{sepay?.count ?? 0} giao dịch</span>}
        />
        <Stat
          label="Tiền mặt"
          value={formatCredits(cash?.totalCredits ?? 0)}
          sub={<span className="tabular">{cash?.count ?? 0} lượt nạp</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Chuyển khoản SePay" description="Xu được cộng mỗi ngày" />
          <div className="px-3 pb-3 pt-4">
            <BarSeriesChart
              data={data.byDay.map((day) => ({
                label: formatShortDay(day.date),
                value: day.sepayCredits,
              }))}
            />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Tiền mặt" description="Xu được cộng mỗi ngày" />
          <div className="px-3 pb-3 pt-4">
            <BarSeriesChart
              tone="ink"
              data={data.byDay.map((day) => ({
                label: formatShortDay(day.date),
                value: day.cashCredits,
              }))}
            />
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Nạp tiền theo ngày" />
        <Table>
          <THead>
            <tr>
              <TH>Ngày</TH>
              <TH align="right">Chuyển khoản</TH>
              <TH align="right">Tiền mặt</TH>
              <TH align="right">Tổng</TH>
            </tr>
          </THead>
          <TBody>
            {data.byDay.map((day) => (
              <TR key={day.date}>
                <TD muted className="tabular">
                  {formatShortDay(day.date)}
                </TD>
                <TD align="right">{formatCredits(day.sepayCredits)}</TD>
                <TD align="right">{formatCredits(day.cashCredits)}</TD>
                <TD align="right" className="font-medium">
                  {formatCredits(day.sepayCredits + day.cashCredits)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Panel>
    </div>
  );
}
