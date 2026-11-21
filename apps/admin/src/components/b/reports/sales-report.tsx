'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
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
  Button,
  errorMessage,
  formatCredits,
  formatNumber,
  formatShortDay,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';

import { BarSeriesChart } from '@/components/bar-series-chart';
import { queryKeys } from '@/lib/query-keys';

export function SalesReport({ from, to }: { from: string; to: string }) {
  const api = useApi();
  const report = useQuery({
    queryKey: queryKeys.sales(from, to),
    queryFn: () => api.admin.salesReport({ from, to }),
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
    return <EmptyState title="Không có đơn hàng trong khoảng này" />;
  }
  const categoryTotal = data.byCategory.reduce((sum, row) => sum + row.totalCredits, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          emphasis
          label="Doanh thu"
          value={formatCredits(data.totalCredits)}
          sub="Các đơn hoàn tất"
        />
        <Stat label="Số đơn" value={formatNumber(data.orderCount)} />
        <Stat
          label="Trung bình/đơn"
          value={formatCredits(
            data.orderCount > 0 ? Math.round(data.totalCredits / data.orderCount) : 0,
          )}
        />
        <Stat label="Đã hủy" value={formatNumber(data.voidedCount)} />
      </div>

      <Panel>
        <PanelHeader title="Doanh thu theo ngày" description="Tổng xu bán ra mỗi ngày" />
        <div className="px-3 pb-3 pt-4">
          <BarSeriesChart
            data={data.byDay.map((day) => ({
              label: formatShortDay(day.date),
              value: day.totalCredits,
            }))}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Món bán chạy" />
          <Table>
            <THead>
              <tr>
                <TH>Món</TH>
                <TH align="right">Số lượng</TH>
                <TH align="right">Doanh thu</TH>
              </tr>
            </THead>
            <TBody>
              {data.byItem.length === 0 ? (
                <tr>
                  <td colSpan={3} className="!py-8 text-center text-sm text-ink-muted">
                    Không có món được bán.
                  </td>
                </tr>
              ) : (
                data.byItem.map((row) => (
                  <TR key={row.menuItemId}>
                    <TD className="font-medium">{row.name}</TD>
                    <TD align="right">{formatNumber(row.quantity)}</TD>
                    <TD align="right">{formatCredits(row.totalCredits)}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </Panel>
        <Panel>
          <PanelHeader title="Theo danh mục" />
          <Table>
            <THead>
              <tr>
                <TH>Danh mục</TH>
                <TH align="right">Doanh thu</TH>
                <TH align="right">Tỷ trọng</TH>
              </tr>
            </THead>
            <TBody>
              {data.byCategory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="!py-8 text-center text-sm text-ink-muted">
                    Không có dữ liệu danh mục.
                  </td>
                </tr>
              ) : (
                data.byCategory.map((row) => {
                  const share = categoryTotal > 0 ? (row.totalCredits / categoryTotal) * 100 : 0;
                  const barWidth =
                    share >= 75
                      ? 'w-full'
                      : share >= 50
                        ? 'w-3/4'
                        : share >= 25
                          ? 'w-1/2'
                          : share > 0
                            ? 'w-1/4'
                            : 'w-0';
                  return (
                    <TR key={row.categoryId}>
                      <TD className="font-medium">{row.name}</TD>
                      <TD align="right">{formatCredits(row.totalCredits)}</TD>
                      <TD align="right">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-20 rounded-[var(--ui-radius-sm)] bg-brand-tint">
                            <span
                              className={`block h-1.5 rounded-[var(--ui-radius-sm)] bg-brand ${barWidth}`}
                            />
                          </span>
                          <span className="tabular text-ink-muted">
                            {formatNumber(Math.round(share))}%
                          </span>
                        </span>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </Panel>
      </div>
    </div>
  );
}
