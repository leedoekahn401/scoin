'use client';

import { Modal, PinPad } from '@schoolcoin/ui';

interface PinDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
  error: string | null;
  resetKey: number;
  disabled: boolean;
}

export function PinDialog({
  open,
  onClose,
  onComplete,
  error,
  resetKey,
  disabled,
}: PinDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Học sinh nhập mã PIN"
      size="sm"
      closeDisabled={disabled}
    >
      <PinPad onComplete={onComplete} error={error} resetKey={resetKey} disabled={disabled} />
    </Modal>
  );
}
