'use client';

import type { CreateInviteResult } from '@schoolcoin/types';
import { Button, Modal, Notice, formatDateTime } from '@schoolcoin/ui';

import { CopyButton } from './copy-button';

export function InviteDialog({
  result,
  onClose,
}: {
  result: CreateInviteResult;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Mã mời phụ huynh"
      size="sm"
      footer={
        <Button variant="primary" data-primary onClick={onClose}>
          Đã lưu mã
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius)] border border-border bg-paper-bg px-4 py-5">
          <span className="min-w-0 break-all font-mono text-2xl font-semibold text-ink-fg">
            {result.code}
          </span>
          <CopyButton value={result.code} label="Sao chép mã mời" />
        </div>
        <Notice tone="warning">Hết hạn {formatDateTime(result.expiresAt)} · dùng một lần.</Notice>
      </div>
    </Modal>
  );
}
