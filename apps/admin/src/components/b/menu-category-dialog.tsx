'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { MenuCategory } from '@schoolcoin/types';
import { Button, Field, Input, Modal, errorMessage, toast } from '@schoolcoin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export function CategoryDialog({
  category,
  onClose,
}: {
  category: MenuCategory | null;
  onClose: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [name, setName] = useState(category?.name ?? '');

  const save = useMutation({
    mutationFn: () =>
      category
        ? api.admin.updateCategory(category.id, { name: name.trim() })
        : api.admin.createCategory({ name: name.trim() }),
    onSuccess: () => {
      toast.success(category ? 'Đã đổi tên danh mục' : 'Đã thêm danh mục');
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Sửa tên danh mục' : 'Thêm danh mục'}
      size="sm"
      closeDisabled={save.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            data-primary
            loading={save.isPending}
            disabled={name.trim().length === 0}
            onClick={() => save.mutate()}
          >
            {category ? 'Lưu tên' : 'Thêm danh mục'}
          </Button>
        </>
      }
    >
      <Field label="Tên danh mục" hint="Ví dụ: Món chính, Nước uống, Tráng miệng">
        {(props) => (
          <Input
            {...props}
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
    </Modal>
  );
}
