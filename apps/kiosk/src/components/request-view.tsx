'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { REQUEST_NOTE_MAX, REQUEST_PRESETS } from '@schoolcoin/types';
import { AmountPicker, Button, LoadingBlock, Notice, errorMessage } from '@schoolcoin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { useKioskMe } from '@/components/home-view';
import { IdleSignOut } from '@/components/kiosk-session';
import { queryKeys } from '@/lib/query-keys';

type Props = {
  onBack: () => void;
  onSent: (amount: number) => void;
};

/** UC-11: ask a parent for credits. BR-09 caps it at 3 a day. */
export function RequestView({ onBack, onSent }: Props) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { data: me, isPending } = useKioskMe();
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const send = useMutation({
    mutationFn: (amountCredits: number) =>
      api.kiosk.createRequest({ amountCredits, note: note.trim() || undefined }),
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.kioskMe });
      onSent(request.amountCredits);
    },
  });

  const blocked = !me
    ? null
    : !me.hasLinkedParent
      ? 'Chưa có phụ huynh liên kết — vui lòng đến văn phòng.'
      : me.requestsSentToday >= me.maxRequestsPerDay
        ? `Bạn chỉ gửi được tối đa ${me.maxRequestsPerDay} yêu cầu mỗi ngày. Hãy thử lại vào ngày mai.`
        : null;

  return (
    <div className="fade-in flex h-dvh flex-col bg-paper-bg">
      <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface-white px-8 py-4">
        <Button size="lg" variant="ghost" leadingIcon={<ArrowLeft />} onClick={onBack}>
          Quay lại
        </Button>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-fg">
          Xin phụ huynh thêm xu
        </h1>
      </header>

      {isPending ? (
        <LoadingBlock className="flex-1" />
      ) : (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-8 py-8">
          {blocked && <Notice tone="warning">{blocked}</Notice>}
          <div className="flex flex-col gap-3">
            <p className="text-lg font-medium text-ink-fg">Bạn cần thêm bao nhiêu?</p>
            <AmountPicker
              presets={REQUEST_PRESETS}
              value={amount}
              onChange={setAmount}
              allowCustom={false}
              size="lg"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="kiosk-note" className="text-lg font-medium text-ink-fg">
              Lời nhắn cho phụ huynh{' '}
              <span className="font-normal text-ink-muted">(không bắt buộc)</span>
            </label>
            <textarea
              id="kiosk-note"
              rows={2}
              maxLength={REQUEST_NOTE_MAX}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Con cần mua thêm vở"
              className="workbook-input resize-none py-3 text-lg"
            />
            <p className="text-right text-base text-ink-muted tabular">
              {note.length}/{REQUEST_NOTE_MAX}
            </p>
          </div>
          {send.error && <Notice tone="danger">{errorMessage(send.error)}</Notice>}
          <Button
            variant="primary"
            size="xl"
            fullWidth
            disabled={!amount || Boolean(blocked)}
            loading={send.isPending}
            onClick={() => amount && send.mutate(amount)}
          >
            {amount ? `Gửi yêu cầu ${amount} xu` : 'Chọn số xu'}
          </Button>
        </div>
      )}
      <IdleSignOut />
    </div>
  );
}
