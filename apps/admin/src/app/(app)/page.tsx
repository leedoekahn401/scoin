'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, can } from '@schoolcoin/types';
import {
  Badge,
  Button,
  EmptyState,
  LinkButton,
  LoadingBlock,
  Money,
  Notice,
  ORDER_STATUS,
  PageHeader,
  Panel,
  PanelHeader,
  Stat,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  errorMessage,
  formatCredits,
  formatNumber,
  formatShortDay,
  formatWhen,
  formatWeekdayDate,
  givenName,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileSearch, Landmark, ShoppingBag, Wallet } from 'lucide-react';

import { BarSeriesChart } from '@/components/bar-series-chart';
import { queryKeys } from '@/lib/query-keys';

/**
 * Dashboard (FR-RPT-05): today's sales, today's top-ups, unmatched payments
 * waiting, outstanding balance, plus a 7-day view and the latest orders.
 * This screen is the REFERENCE for how admin pages fetch and lay out data.
 */
export default function DashboardPage() {
  const api = useApi();
  const { user } = useSession();
  const canSeeMoney = can(user?.role, Capability.MANAGE_MONEY);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.admin.dashboard(),
    refetchInterval: 30_000,
  });

  return (
    <>
      <PageHeader
        title={`Chào ${givenName(user?.fullName ?? '')}`}
        description={`Tình hình căng tin ${formatWeekdayDate(new Date())}.`}
        actions={
          <LinkButton href="/reports" trailingIcon={<ArrowRight />}>
            Xem báo cáo
          </LinkButton>
        }
      />

      {isPending ? (
        <LoadingBlock className="min-h-80" />
      ) : error ? (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(error)}
        </Notice>
      ) : (
        <div className="flex flex-col gap-6">
          {canSeeMoney && data.unmatchedPayments > 0 && (
            <Notice
              tone="warning"
              title={`${data.unmatchedPayments} giao dịch chuyển khoản chưa khớp`}
              action={
                <LinkButton href="/money/unmatched" size="sm" variant="primary">
                  Xử lý ngay
                </LinkButton>
              }
            >
              Khoản tiền đã vào tài khoản trường nhưng chưa có mã nạp. Hãy gán cho học sinh hoặc bỏ
              qua.
            </Notice>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              emphasis
              label="Doanh thu hôm nay"
              icon={<ShoppingBag />}
              value={formatCredits(data.todaySalesCredits)}
              sub={`${formatNumber(data.todayOrderCount)} đơn hàng`}
            />
            <Stat
              label="Nạp tiền hôm nay"
              icon={<Landmark />}
              value={formatCredits(data.todayTopUpsCredits)}
              sub={`${formatNumber(data.todayTopUpCount)} lượt nạp`}
            />
            <Stat
              label="Chờ xử lý"
              icon={<FileSearch />}
              value={formatNumber(data.unmatchedPayments + data.topUpsToReview)}
              sub={`${data.unmatchedPayments} chưa khớp · ${data.topUpsToReview} cần kiểm tra`}
            />
            <Stat
              label="Tổng số dư học sinh"
              icon={<Wallet />}
              value={formatCredits(data.outstandingCredits)}
              sub="Số xu nhà trường đang giữ hộ"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel>
              <PanelHeader title="Doanh thu 7 ngày" description="Tổng xu bán ra mỗi ngày" />
              <div className="px-3 pb-3 pt-4">
                <BarSeriesChart
                  data={data.salesLast7Days.map((d) => ({
                    label: formatShortDay(d.date),
                    value: d.totalCredits,
                  }))}
                />
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="Nạp tiền 7 ngày" description="Chuyển khoản và tiền mặt" />
              <div className="px-3 pb-3 pt-4">
                <BarSeriesChart
                  tone="ink"
                  data={data.topUpsLast7Days.map((d) => ({
                    label: formatShortDay(d.date),
                    value: d.totalCredits,
                  }))}
                />
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelHeader
              title="Đơn hàng gần đây"
              actions={
                can(user?.role, Capability.VOID_ANY_ORDER) ? (
                  <LinkButton
                    href="/orders"
                    size="sm"
                    variant="ghost"
                    trailingIcon={<ArrowRight />}
                  >
                    Tất cả đơn hôm nay
                  </LinkButton>
                ) : undefined
              }
            />
            {data.recentOrders.length === 0 ? (
              <EmptyState icon={<ShoppingBag />} title="Chưa có đơn hàng nào" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Giờ</TH>
                    <TH>Học sinh</TH>
                    <TH>Món</TH>
                    <TH>Thu ngân</TH>
                    <TH>Trạng thái</TH>
                    <TH align="right">Tổng</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentOrders.map((order) => (
                    <TR key={order.id}>
                      <TD muted className="tabular">
                        {formatWhen(order.createdAt)}
                      </TD>
                      <TD>
                        <span className="font-medium">{order.studentName}</span>
                        <span className="ml-2 text-ink-muted">{order.className}</span>
                      </TD>
                      <TD muted className="max-w-72 truncate">
                        {order.items
                          .map((i) => `${i.nameSnapshot}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                          .join(', ')}
                      </TD>
                      <TD muted>{order.cashierName}</TD>
                      <TD>
                        <Badge tone={ORDER_STATUS[order.status].tone}>
                          {ORDER_STATUS[order.status].label}
                        </Badge>
                      </TD>
                      <TD align="right">
                        <Money credits={order.totalCredits} inline showVnd={false} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
