'use client';

import { Copy } from 'lucide-react';

import { IconButton, toast } from '@schoolcoin/ui';

export function CopyButton({ value, label = 'Sao chép' }: { value: string; label?: string }) {
  return (
    <IconButton
      label={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(
          () => toast.success('Đã sao chép'),
          () => toast.error('Không thể sao chép. Vui lòng chọn và sao chép thủ công.'),
        );
      }}
    >
      <Copy />
    </IconButton>
  );
}
