'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { isApiError } from '@schoolcoin/api-client';
import type { CreateOrderResult, PosLookupResult } from '@schoolcoin/types';

type StudentWithCode = PosLookupResult & { cardCode: string };
import {
  Button,
  EmptyState,
  LoadingBlock,
  Modal,
  Notice,
  errorMessage,
  newIdempotencyKey,
} from '@schoolcoin/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { ApiError } from '@schoolcoin/api-client';

import { CartPanel } from '@/components/cart-panel';
import { ChargeResult } from '@/components/charge-result';
import { MenuGrid } from '@/components/menu-grid';
import { PinDialog } from '@/components/pin-dialog';
import { StudentCard } from '@/components/student-card';
import { useCart } from '@/components/use-cart';
import { queryKeys } from '@/lib/query-keys';

type DeclineState = { message: string } | null;

export default function SellPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const cart = useCart();

  const [student, setStudent] = useState<StudentWithCode | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey());
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinResetKey, setPinResetKey] = useState(0);
  const [decline, setDecline] = useState<DeclineState>(null);
  const [networkError, setNetworkError] = useState(false);
  const [success, setSuccess] = useState<CreateOrderResult | null>(null);
  const [charging, setCharging] = useState(false);

  const menuQuery = useQuery({
    queryKey: queryKeys.menu,
    queryFn: () => api.pos.getMenu(),
  });

  const resetForNewOrder = useCallback(() => {
    cart.clear();
    setStudent(null);
    setSuccess(null);
    setDecline(null);
    setNetworkError(false);
    setPinOpen(false);
    setPinError(null);
    setCharging(false);
    setIdempotencyKey(newIdempotencyKey());
  }, [cart]);

  const pinThreshold = student?.pinThreshold ?? 0;

  const removeUnavailableItems = useCallback(
    (menuItemIds: unknown) => {
      if (!Array.isArray(menuItemIds)) return;
      for (const id of menuItemIds) {
        if (typeof id === 'string') cart.remove(id);
      }
    },
    [cart],
  );

  const submitCharge = useCallback(
    async (pin?: string) => {
      if (!student || cart.lines.length === 0) return;
      setCharging(true);
      setNetworkError(false);
      try {
        const result = await api.pos.createOrder({
          cardCode: student.cardCode,
          items: cart.lines.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
          })),
          pin,
          idempotencyKey,
        });
        setPinOpen(false);
        setPinError(null);
        setSuccess(result);
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      } catch (err) {
        if (isApiError(err, 'NETWORK_ERROR')) {
          setNetworkError(true);
          return;
        }
        if (isApiError(err, 'PIN_INVALID')) {
          setPinError(errorMessage(err));
          setPinResetKey((k) => k + 1);
          setIdempotencyKey(newIdempotencyKey());
          setPinOpen(true);
          return;
        }
        if (isApiError(err, 'PIN_LOCKED')) {
          setPinOpen(false);
          setDecline({ message: errorMessage(err) });
          setIdempotencyKey(newIdempotencyKey());
          return;
        }
        if (isApiError(err, 'ITEM_UNAVAILABLE')) {
          removeUnavailableItems((err as ApiError).detailsOf('ITEM_UNAVAILABLE')?.menuItemIds);
          void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
          void menuQuery.refetch();
        }
        if (
          isApiError(err, 'INSUFFICIENT_BALANCE') ||
          isApiError(err, 'DAILY_LIMIT_REACHED') ||
          isApiError(err, 'CARD_INACTIVE') ||
          isApiError(err, 'ITEM_UNAVAILABLE')
        ) {
          setPinOpen(false);
          setDecline({ message: errorMessage(err) });
          setIdempotencyKey(newIdempotencyKey());
          return;
        }
        setPinOpen(false);
        setDecline({ message: errorMessage(err) });
        setIdempotencyKey(newIdempotencyKey());
      } finally {
        setCharging(false);
      }
    },
    [api, cart, idempotencyKey, menuQuery, queryClient, removeUnavailableItems, student],
  );

  const startCharge = useCallback(() => {
    if (!student || cart.lines.length === 0 || charging) return;
    if (cart.totalCredits > pinThreshold) {
      setPinError(null);
      setPinResetKey((k) => k + 1);
      setPinOpen(true);
      return;
    }
    void submitCharge();
  }, [cart.lines.length, cart.totalCredits, charging, pinThreshold, student, submitCharge]);

  const canCharge =
    Boolean(student) && cart.lines.length > 0 && !charging && !networkError && !success;

  const anyModalOpen = pinOpen || Boolean(decline);

  if (menuQuery.isPending) {
    return <LoadingBlock className="h-full min-h-0" />;
  }

  if (menuQuery.error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Notice
          tone="danger"
          title="Không tải được thực đơn"
          action={
            <Button size="sm" onClick={() => menuQuery.refetch()} leadingIcon={<RefreshCw />}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(menuQuery.error)}
        </Notice>
      </div>
    );
  }

  const categories = menuQuery.data ?? [];

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {categories.length === 0 ? (
          <EmptyState icon={<ShoppingBag />} title="Chưa có món nào" />
        ) : (
          <MenuGrid
            categories={categories}
            quantityByItem={cart.quantityByItem}
            onAdd={(item) =>
              cart.add({
                menuItemId: item.id,
                name: item.name,
                unitPriceCredits: item.priceCredits,
              })
            }
          />
        )}
      </div>

      <aside className="flex h-full min-h-0 w-[27rem] shrink-0 flex-col border-l border-border bg-surface-white">
        {success ? (
          <ChargeResult
            totalCredits={success.order.totalCredits}
            studentName={success.order.studentName}
            balanceAfter={success.balanceAfter}
            remainingToday={success.remainingToday}
            onNew={resetForNewOrder}
          />
        ) : (
          <>
            <StudentCard
              student={student}
              onStudent={(next) => {
                setStudent(next);
                setNetworkError(false);
                setDecline(null);
              }}
              scanEnabled={!anyModalOpen}
            />
            <CartPanel
              lines={cart.lines}
              totalCredits={cart.totalCredits}
              onSetQty={cart.setQty}
              onRemove={cart.remove}
              onClear={cart.clear}
              balance={student?.balance ?? null}
              remainingToday={student?.remainingToday ?? null}
              pinThreshold={pinThreshold}
              canCharge={canCharge}
              onCharge={startCharge}
            />
            {networkError && (
              <div className="border-t border-border p-4">
                <Notice
                  tone="danger"
                  title="Mất kết nối"
                  action={
                    <Button size="sm" onClick={() => void submitCharge()}>
                      Thử lại
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </aside>

      <PinDialog
        open={pinOpen}
        onClose={() => {
          if (charging) return;
          setPinOpen(false);
          setPinError(null);
          setIdempotencyKey(newIdempotencyKey());
        }}
        onComplete={(pin) => void submitCharge(pin)}
        error={pinError}
        resetKey={pinResetKey}
        disabled={charging}
      />

      <Modal
        open={Boolean(decline)}
        onClose={() => setDecline(null)}
        title="Không thể thanh toán"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setDecline(null)}>
            Đã hiểu
          </Button>
        }
      >
        <p className="text-lg font-medium text-ink-fg">{decline?.message}</p>
      </Modal>
    </div>
  );
}
