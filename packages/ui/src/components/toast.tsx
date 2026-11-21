'use client';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast';

/**
 * App-wide toasts in Warm Studio style: white card, hairline, soft shadow.
 * Use `toast.success("Đã lưu")`, `toast.error(errorMessage(err))`.
 */
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      gutter={8}
      toastOptions={{
        duration: 3500,
        className:
          '!rounded-[var(--ui-radius)] !border !border-border !bg-surface-white !text-sm !text-ink-fg !shadow-[var(--ui-shadow-md)] !px-3 !py-2.5',
        success: { icon: <CheckCircle2 className="size-[1.125rem] shrink-0 text-success" /> },
        error: {
          icon: <AlertCircle className="size-[1.125rem] shrink-0 text-danger" />,
          duration: 5000,
        },
      }}
    />
  );
}

export const toast = Object.assign(
  (message: string) =>
    hotToast(message, { icon: <Info className="size-[1.125rem] shrink-0 text-info" /> }),
  {
    success: (message: string) => hotToast.success(message),
    error: (message: string) => hotToast.error(message),
    dismiss: hotToast.dismiss,
  },
);
