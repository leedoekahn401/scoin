'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, can, type Order } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  LoadingBlock,
  Money,
  Notice,
  ORDER_STATUS,
  Panel,
  SearchInput,
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
  formatWhen,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export default function OrdersPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [voidTarget, setVoidTarget] = useState<Order | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => api.pos.listOrders(),
    refetchInterval: 20_000,
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.pos.voidOrder(id, { reason }),
    onSuccess: (order) => {
      toast.success(
        `Đã hủy đơn, hoàn ${formatCredits(order.totalCredits)} cho ${order.studentName}`,
      );
      setVoidTarget(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const orders = useMemo(() => data ?? [], [data]);
  const completed = useMemo(() => orders.filter((o) => o.status === 'COMPLETED'), [orders]);
  const voided = useMemo(() => orders.filter((o) => o.status === 'VOIDED'), [orders]);
  const revenue = useMemo(() => completed.reduce((sum, o) => sum + o.totalCredits, 0), [completed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.studentName.toLowerCase().includes(q));
  }, [orders, search]);

  const canVoidAny = can(user?.role, Capability.VOID_ANY_ORDER);
  const canVoidOrder = (order: Order) =>
    order.status === 'COMPLETED' && (canVoidAny || order.cashierId === user?.id);

  if (isPending) {
    return <LoadingBlock className="h-full min-h-0" />;
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Notice
          tone="danger"
          title="Không tải được danh sách đơn"
          action={
            <Button size="sm" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(error)}
        </Notice>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={<ReceiptText />} title="Chưa có đơn hàng hôm nay" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Doanh thu" value={formatCredits(revenue)} sub="Đơn hoàn tất" />
        <Stat label="Số đơn" value={formatNumber(completed.length)} sub="Hoàn tất" />
        <Stat label="Đã hủy" value={formatNumber(voided.length)} sub="Đơn bị hủy" />
      </div>

      <Panel>
        <div className="border-b border-border p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên học sinh"
            className="max-w-sm"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy đơn phù hợp" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Giờ</TH>
                <TH>Học sinh</TH>
                <TH>Món</TH>
                <TH align="right">Tổng</TH>
                <TH>Trạng thái</TH>
                <TH align="right">Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map((order) => (
                <TR key={order.id}>
                  <TD muted className="tabular whitespace-nowrap">
                    {formatTime(order.createdAt)}
                  </TD>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium text-ink-fg">{order.studentName}</span>
                      <span className="text-[0.8125rem] text-ink-muted">{order.className}</span>
                    </div>
                  </TD>
                  <TD muted className="max-w-80 truncate">
                    {order.items
                      .map((i) => `${i.nameSnapshot}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                      .join(', ')}
                  </TD>
                  <TD align="right">
                    <Money credits={order.totalCredits} inline showVnd={false} />
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-1">
                      <Badge tone={ORDER_STATUS[order.status].tone}>
                        {ORDER_STATUS[order.status].label}
                      </Badge>
                      {order.status === 'VOIDED' && (order.voidReason || order.voidedAt) && (
                        <span className="text-[0.8125rem] text-ink-muted">
                          {order.voidReason}
                          {order.voidedAt ? ` · ${formatWhen(order.voidedAt)}` : ''}
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD align="right">
                    {canVoidOrder(order) && (
                      <Button variant="danger" size="sm" onClick={() => setVoidTarget(order)}>
                        Hủy đơn
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        onConfirm={(reason) => {
          if (voidTarget) voidMutation.mutate({ id: voidTarget.id, reason });
        }}
        title="Hủy đơn hàng"
        description={
          voidTarget
            ? `Hủy đơn của ${voidTarget.studentName} và hoàn ${formatCredits(voidTarget.totalCredits)}.`
            : undefined
        }
        destructive
        reasonLabel="Lý do hủy"
        confirmLabel="Hủy đơn"
        loading={voidMutation.isPending}
      />
    </div>
  );
}
