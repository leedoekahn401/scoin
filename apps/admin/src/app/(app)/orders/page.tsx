'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { OrderStatus } from '@schoolcoin/types';
import type { Order } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  LoadingBlock,
  Money,
  Notice,
  ORDER_STATUS,
  PageHeader,
  Panel,
  PanelHeader,
  PillToggle,
  SearchInput,
  Select,
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
  formatTime,
  toast,
  type PillOption,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';

import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { queryKeys } from '@/lib/query-keys';

type StatusFilter = 'ALL' | OrderStatus;

const statusOptions: readonly PillOption<StatusFilter>[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: OrderStatus.COMPLETED, label: 'Hoàn tất' },
  { value: OrderStatus.VOIDED, label: 'Đã hủy' },
];

export default function OrdersPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.VOID_ANY_ORDER)) {
    return <ForbiddenNotice title="Đơn hàng" />;
  }
  return <OrdersScreen />;
}

function OrdersScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cashier, setCashier] = useState('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [voiding, setVoiding] = useState<Order | null>(null);

  const orders = useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => api.pos.listOrders(),
    refetchInterval: 20_000,
  });

  const voidOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.pos.voidOrder(id, { reason }),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng');
      setVoiding(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const allOrders = useMemo(() => orders.data ?? [], [orders.data]);
  const cashiers = useMemo(() => {
    const map = new Map<string, string>();
    for (const order of allOrders) map.set(order.cashierId, order.cashierName);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allOrders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('vi');
    return allOrders.filter((order) => {
      if (status !== 'ALL' && order.status !== status) return false;
      if (cashier !== 'ALL' && order.cashierId !== cashier) return false;
      if (!term) return true;
      return `${order.studentName} ${order.className}`.toLocaleLowerCase('vi').includes(term);
    });
  }, [allOrders, cashier, search, status]);

  const revenue = allOrders
    .filter((order) => order.status === OrderStatus.COMPLETED)
    .reduce((sum, order) => sum + order.totalCredits, 0);
  const voidedCount = allOrders.filter((order) => order.status === OrderStatus.VOIDED).length;

  return (
    <>
      <PageHeader
        title="Đơn hàng hôm nay"
        description="Theo dõi đơn hàng trong ngày và hủy đơn khi cần."
      />

      {orders.isPending ? (
        <LoadingBlock className="min-h-80" />
      ) : orders.error ? (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void orders.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(orders.error)}
        </Notice>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              emphasis
              label="Doanh thu"
              icon={<span className="text-sm">₫</span>}
              value={formatCredits(revenue)}
              sub="Các đơn hoàn tất"
            />
            <Stat label="Số đơn" value={formatNumber(allOrders.length)} sub="Tất cả trạng thái" />
            <Stat label="Đã hủy" value={formatNumber(voidedCount)} sub="Đơn bị hủy trong ngày" />
          </div>

          <Panel>
            <PanelHeader
              title="Danh sách đơn"
              description={<span className="tabular">{formatNumber(filtered.length)} đơn</span>}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Tìm học sinh hoặc lớp…"
                    className="w-56"
                  />
                  <Select
                    aria-label="Lọc theo thu ngân"
                    value={cashier}
                    onChange={(event) => setCashier(event.target.value)}
                    className="w-44"
                  >
                    <option value="ALL">Mọi thu ngân</option>
                    {cashiers.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </Select>
                  <PillToggle
                    options={statusOptions}
                    value={status}
                    onChange={setStatus}
                    ariaLabel="Lọc theo trạng thái đơn"
                    layoutIdPrefix="orders-status"
                  />
                </div>
              }
            />
            {allOrders.length === 0 ? (
              <EmptyState title="Chưa có đơn hàng nào hôm nay" />
            ) : filtered.length === 0 ? (
              <EmptyState title="Không có đơn nào khớp bộ lọc" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Giờ</TH>
                    <TH>Học sinh</TH>
                    <TH>Món</TH>
                    <TH>Thu ngân</TH>
                    <TH align="right">Tổng</TH>
                    <TH>Trạng thái</TH>
                    <TH align="right">Thao tác</TH>
                  </tr>
                </THead>
                <TBody>
                  {filtered.map((order) => (
                    <Fragment key={order.id}>
                      <TR>
                        <TD muted className="tabular">
                          {formatTime(order.createdAt)}
                        </TD>
                        <TD>
                          <span className="font-medium">{order.studentName}</span>
                          <span className="ml-2 text-ink-muted">{order.className}</span>
                        </TD>
                        <TD muted className="max-w-72 truncate">
                          {order.items
                            .map(
                              (line) =>
                                `${line.nameSnapshot}${line.quantity > 1 ? ` ×${line.quantity}` : ''}`,
                            )
                            .join(', ')}
                        </TD>
                        <TD muted>{order.cashierName}</TD>
                        <TD align="right">
                          <Money credits={order.totalCredits} inline showVnd={false} />
                        </TD>
                        <TD>
                          <Badge tone={ORDER_STATUS[order.status].tone}>
                            {ORDER_STATUS[order.status].label}
                          </Badge>
                        </TD>
                        <TD align="right">
                          {order.status === OrderStatus.COMPLETED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger"
                              onClick={() => setVoiding(order)}
                            >
                              Hủy đơn
                            </Button>
                          )}
                        </TD>
                      </TR>
                      {order.status === OrderStatus.VOIDED && order.voidReason && (
                        <TR>
                          <TD colSpan={7} className="!py-2 text-xs text-danger">
                            Lý do hủy: {order.voidReason}
                          </TD>
                        </TR>
                      )}
                    </Fragment>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={voiding !== null}
        onClose={() => setVoiding(null)}
        onConfirm={(reason) => {
          if (!voiding) return;
          voidOrder.mutate({ id: voiding.id, reason });
        }}
        title="Hủy đơn hàng"
        description={
          voiding ? (
            <span className="tabular">
              Đơn của {voiding.studentName} trị giá {formatCredits(voiding.totalCredits)} sẽ được
              hoàn xu.
            </span>
          ) : undefined
        }
        confirmLabel="Hủy đơn"
        destructive
        loading={voidOrder.isPending}
        reasonLabel="Lý do hủy"
        reasonPlaceholder="Ví dụ: học sinh đổi ý"
      />
    </>
  );
}
