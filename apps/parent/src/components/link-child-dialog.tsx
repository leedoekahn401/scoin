'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

import { Button, Field, Input, Modal, Notice, errorMessage, toast } from '@schoolcoin/ui';

export function LinkChildDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const link = useMutation({
    mutationFn: (inviteCode: string) => api.parent.linkChild({ inviteCode }),
    onSuccess: (child) => {
      toast.success(`Đã liên kết ${child.fullName}`);
      setCode('');
      onClose();
      void queryClient.invalidateQueries({ queryKey: queryKeys.children });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Liên kết thêm con"
      description="Nhập mã mời do nhà trường gửi cho học sinh."
      size="sm"
      closeDisabled={link.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={link.isPending}>
            Hủy
          </Button>
          <Button
            data-primary
            variant="primary"
            loading={link.isPending}
            disabled={code.trim().length === 0}
            onClick={() => link.mutate(code.trim().toUpperCase())}
          >
            Liên kết
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim()) link.mutate(code.trim().toUpperCase());
        }}
      >
        <Field label="Mã mời" hint="Nhà trường gửi mã mời cho từng học sinh">
          {(props) => (
            <Input
              {...props}
              value={code}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="DEMO2026"
              maxLength={8}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toUpperCase()
                    .slice(0, 8),
                )
              }
            />
          )}
        </Field>
        {link.isError && <Notice tone="danger">{errorMessage(link.error)}</Notice>}
      </form>
    </Modal>
  );
}
