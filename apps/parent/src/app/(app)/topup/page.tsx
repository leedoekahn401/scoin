'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { TOPUP_PRESETS, VND_PER_CREDIT } from '@schoolcoin/types';
import {
  AmountPicker,
  Avatar,
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  errorMessage,
  formatCredits,
  formatVnd,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export default function TopUpPage() {
  return (
    <Suspense fallback={<LoadingBlock className="min-h-80" />}>
      <TopUpScreen />
    </Suspense>
  );
}

function TopUpScreen() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get('studentId');
  const creditRequestId = searchParams.get('requestId') ?? undefined;
  const [selectedId, setSelectedId] = useState(studentIdParam ?? '');
  const [amount, setAmount] = useState<number | null>(null);

  const children = useQuery({
    queryKey: queryKeys.children,
    queryFn: () => api.parent.listChildren(),
  });
  const settings = useQuery({
    queryKey: queryKeys.publicSettings,
    queryFn: () => api.publicSettings(),
  });

  const createTopUp = useMutation({
    mutationFn: (studentId: string) =>
      api.parent.createTopUp({
        studentId,
        amountCredits: amount ?? 0,
        ...(creditRequestId ? { creditRequestId } : {}),
      }),
    onSuccess: (checkout) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.topUps });
      router.replace(`/topup/${checkout.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const list = children.data ?? [];
  const currentId = selectedId || (list.length === 1 ? (list[0]?.studentId ?? '') : '');
  const currentChild = list.find((child) => child.studentId === currentId);

  if (children.isPending || settings.isPending) return <LoadingBlock className="min-h-80" />;
  if (children.error) {
    return (
      <Notice
        tone="danger"
        action={<Button onClick={() => void children.refetch()}>Thử lại</Button>}
      >
        {errorMessage(children.error)}
      </Notice>
    );
  }
  if (settings.error) {
    return (
      <Notice
        tone="danger"
        action={<Button onClick={() => void settings.refetch()}>Thử lại</Button>}
      >
        {errorMessage(settings.error)}
      </Notice>
    );
  }
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<UsersRound />}
        title="Chưa có học sinh để nạp xu"
        description="Liên kết với con bằng mã mời của nhà trường trước khi nạp xu."
        action={<Button onClick={() => router.push('/')}>Về trang chính</Button>}
      />
    );
  }

  const min = settings.data?.topUpMinCredits ?? 10;
  const max = settings.data?.topUpMaxCredits ?? 2000;

  return (
    <>
      <PageHeader
        back={{ href: '/', label: 'Các con' }}
        title="Nạp xu"
        description="Chọn học sinh và số xu muốn nạp."
      />

      <div className="flex flex-col gap-5">
        {list.length > 1 && (
          <Panel>
            <PanelHeader title="Nạp xu cho" description="Chọn một học sinh" />
            <div
              role="radiogroup"
              aria-label="Chọn học sinh"
              className="grid grid-cols-1 gap-2 px-5 py-5 sm:grid-cols-2"
            >
              {list.map((child) => {
                const active = child.studentId === currentId;
                return (
                  <button
                    key={child.studentId}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedId(child.studentId)}
                    className={`workbook-press flex items-center gap-3 rounded-[var(--ui-radius)] border px-4 py-3 text-left ${
                      active
                        ? 'border-brand bg-brand-tint ring-[3px] ring-brand/20'
                        : 'border-border bg-surface-white hover:border-border-strong hover:bg-paper-bg'
                    }`}
                  >
                    <Avatar name={child.fullName} src={child.photoUrl} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-fg">
                        {child.fullName}
                      </span>
                      <span className="block text-xs text-ink-muted tabular">
                        {formatCredits(child.balanceCredits)} · {child.className}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        {currentChild && (
          <p className="text-[0.8125rem] text-ink-muted">
            Nạp xu cho <span className="font-medium text-ink-fg">{currentChild.fullName}</span>
          </p>
        )}

        <Panel>
          <PanelHeader
            title="Số xu muốn nạp"
            description={`Từ ${formatCredits(min)} đến ${formatCredits(max)}`}
          />
          <form
            className="flex flex-col gap-5 px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (currentId && amount !== null) createTopUp.mutate(currentId);
            }}
          >
            <div className="flex flex-col gap-3">
              <p id="topup-amount-label" className="text-[0.8125rem] font-medium text-ink-fg">
                Chọn số xu
              </p>
              <div role="group" aria-labelledby="topup-amount-label">
                <AmountPicker
                  presets={TOPUP_PRESETS}
                  value={amount}
                  onChange={setAmount}
                  min={min}
                  max={max}
                  size="lg"
                />
              </div>
            </div>

            {amount !== null && (
              <p className="rounded-[var(--ui-radius)] border border-border bg-paper-bg px-4 py-3 text-sm text-ink-muted">
                Bạn sẽ chuyển{' '}
                <span className="font-semibold tabular text-ink-fg">
                  {formatVnd(amount * VND_PER_CREDIT)}
                </span>
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={createTopUp.isPending}
              disabled={!currentId || amount === null || amount < min || amount > max}
            >
              Tạo mã QR
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
