'use client';

import { VND_PER_CREDIT } from '@schoolcoin/types';
import type { SepayTransaction, StudentListItem } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  Modal,
  formatCredits,
  formatDateTime,
  formatVnd,
} from '@schoolcoin/ui';
import { useState } from 'react';

import { StudentPicker } from '@/components/b/student-picker';

export function UnmatchedAssignDialog({
  tx,
  pending,
  onClose,
  onConfirm,
}: {
  tx: SepayTransaction;
  pending: boolean;
  onClose: () => void;
  onConfirm: (studentId: string, note?: string) => void;
}) {
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [note, setNote] = useState('');
  const creditedCredits = Math.floor(tx.transferAmountVnd / VND_PER_CREDIT);
  const remainderVnd = tx.transferAmountVnd % VND_PER_CREDIT;

  return (
    <Modal
      open
      onClose={onClose}
      title="Gán cho học sinh"
      description="Kiểm tra thông tin chuyển khoản trước khi cộng xu."
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
            disabled={!student}
            onClick={() => {
              if (!student) return;
              onConfirm(student.id, note.trim() || undefined);
            }}
          >
            Xác nhận gán
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-[var(--ui-radius)] border border-border bg-paper-bg px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Ngân hàng</span>
            <span className="font-medium text-ink-fg">{tx.gateway}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Số tiền</span>
            <span className="font-medium tabular text-ink-fg">
              {formatVnd(tx.transferAmountVnd)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Thời gian</span>
            <span className="font-medium tabular text-ink-fg">
              {formatDateTime(tx.transactionDate)}
            </span>
          </div>
          <p className="mt-1 break-words font-mono text-xs text-ink-fg">{tx.content}</p>
        </div>
        <Field label="Học sinh">
          {() => <StudentPicker value={student} onChange={setStudent} />}
        </Field>
        <div className="rounded-[var(--ui-radius)] border border-brand/40 bg-brand-tint px-4 py-3 text-sm">
          <p className="font-medium tabular text-ink-fg">
            Sẽ cộng {formatCredits(creditedCredits)}
          </p>
          {remainderVnd > 0 && (
            <p className="mt-0.5 tabular text-ink-muted">
              Phần lẻ {formatVnd(remainderVnd)} không được quy đổi
            </p>
          )}
        </div>
        <Field label="Ghi chú" optional>
          {(props) => (
            <Input
              {...props}
              value={note}
              maxLength={200}
              placeholder="Ví dụ: chuyển khoản của phụ huynh"
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}
