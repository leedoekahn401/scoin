'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { Card } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  CARD_STATUS,
  ConfirmDialog,
  EmptyState,
  LinkButton,
  Panel,
  PanelHeader,
  errorMessage,
  formatCardCode,
  formatDate,
  toast,
} from '@schoolcoin/ui';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export function StudentCardsPanel({ studentId, cards }: { studentId: string; cards: Card[] }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const editable = can(user?.role, Capability.MANAGE_STUDENTS);
  const [confirm, setConfirm] = useState<'issue' | 'lock' | null>(null);
  const activeCard = cards.find((card) => card.status === 'ACTIVE');

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.student(studentId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
  };

  const issue = useMutation({
    mutationFn: () => api.admin.issueCard(studentId),
    onSuccess: () => {
      toast.success('Đã cấp thẻ mới');
      refresh();
      setConfirm(null);
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setConfirm(null);
    },
  });

  const lock = useMutation({
    mutationFn: (cardId: string) => api.admin.lockCard(cardId),
    onSuccess: () => {
      toast.success('Đã khóa thẻ');
      refresh();
      setConfirm(null);
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setConfirm(null);
    },
  });

  return (
    <Panel>
      <PanelHeader
        title="Thẻ"
        description="Mỗi học sinh có một thẻ đang dùng"
        actions={
          <LinkButton href={`/cards?ids=${studentId}`} size="sm">
            In thẻ
          </LinkButton>
        }
      />
      <div className="flex flex-col gap-4 px-5 py-5">
        {cards.length === 0 ? (
          <EmptyState title="Chưa có thẻ" description="Cấp thẻ để học sinh dùng tại căng tin." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {cards.map((card) => (
              <li key={card.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink-fg">{formatCardCode(card.code)}</p>
                  <p className="text-xs text-ink-muted">Cấp ngày {formatDate(card.issuedAt)}</p>
                </div>
                <Badge tone={CARD_STATUS[card.status].tone}>{CARD_STATUS[card.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setConfirm('issue')}>
              Cấp thẻ mới
            </Button>
            {activeCard && (
              <Button variant="secondary" size="sm" onClick={() => setConfirm('lock')}>
                Khóa thẻ
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm === 'issue'}
        onClose={() => setConfirm(null)}
        onConfirm={() => issue.mutate()}
        title="Cấp thẻ mới"
        description="Thẻ hiện tại sẽ chuyển sang Đã thay. Số dư không đổi."
        confirmLabel="Cấp thẻ"
        loading={issue.isPending}
      />
      <ConfirmDialog
        open={confirm === 'lock'}
        onClose={() => setConfirm(null)}
        onConfirm={() => (activeCard ? lock.mutate(activeCard.id) : setConfirm(null))}
        title="Khóa thẻ đang dùng"
        description="Học sinh sẽ không dùng được thẻ này cho đến khi được cấp thẻ mới."
        confirmLabel="Khóa thẻ"
        destructive
        loading={lock.isPending}
      />
    </Panel>
  );
}
