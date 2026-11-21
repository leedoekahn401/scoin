'use client';

import { VND_PER_CREDIT } from '@schoolcoin/types';
import { Button, Field, Input, Modal, formatCredits } from '@schoolcoin/ui';
import { useState } from 'react';

export function UnmatchedSimulateDialog({
  pending,
  onClose,
  onSimulate,
}: {
  pending: boolean;
  onClose: () => void;
  onSimulate: (amountVnd: number, content: string) => void;
}) {
  const [amount, setAmount] = useState(250_000);
  const [content, setContent] = useState('SC12345678');

  return (
    <Modal
      open
      onClose={onClose}
      title="Giả lập chuyển khoản (demo)"
      description="Tạo một giao dịch SePay để thử quy trình đối chiếu."
      size="sm"
      closeDisabled={pending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            data-primary
            loading={pending}
            disabled={amount <= 0 || content.trim().length === 0}
            onClick={() => onSimulate(amount, content.trim())}
          >
            Giả lập
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Số tiền (₫)">
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          )}
        </Field>
        <Field label="Nội dung chuyển khoản" hint="Ví dụ: SC12345678">
          {(props) => (
            <Input
              {...props}
              value={content}
              maxLength={100}
              onChange={(event) => setContent(event.target.value)}
            />
          )}
        </Field>
        {amount > 0 && (
          <p className="tabular text-xs text-ink-muted">
            Số xu tương ứng: {formatCredits(Math.floor(amount / VND_PER_CREDIT))}
          </p>
        )}
      </div>
    </Modal>
  );
}
