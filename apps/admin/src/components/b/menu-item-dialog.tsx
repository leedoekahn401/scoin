'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { MenuCategory, MenuItem } from '@schoolcoin/types';
import { Button, Field, Input, Modal, Select, Switch, errorMessage, toast } from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name: z.string().trim().min(1, 'Nhập tên món').max(80, 'Tên món quá dài'),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  priceCredits: z
    .number()
    .int('Giá phải là số nguyên')
    .min(1, 'Giá tối thiểu 1 xu')
    .max(1000, 'Giá tối đa 1.000 xu'),
  available: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function MenuItemDialog({
  item,
  categories,
  onClose,
}: {
  item: MenuItem | null;
  categories: MenuCategory[];
  onClose: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      categoryId: item?.categoryId ?? categories[0]?.id ?? '',
      priceCredits: item?.priceCredits ?? 20,
      available: item?.available ?? true,
    },
  });

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      item ? api.admin.updateItem(item.id, values) : api.admin.createItem(values),
    onSuccess: () => {
      toast.success(item ? 'Đã lưu món' : 'Đã thêm món');
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Sửa món' : 'Thêm món'}
      size="md"
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
            onClick={handleSubmit((values) => save.mutate(values))}
          >
            {item ? 'Lưu món' : 'Thêm món'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="flex flex-col gap-4"
      >
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field label="Tên món" error={fieldState.error?.message}>
              {(props) => <Input {...props} {...field} maxLength={80} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field label="Danh mục" error={fieldState.error?.message}>
              {(props) => (
                <Select {...props} {...field}>
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="priceCredits"
          render={({ field, fieldState }) => (
            <Field
              label="Giá"
              error={fieldState.error?.message}
              hint={<span className="tabular">Từ 1 đến 1.000 xu</span>}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  suffix="xu"
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
                  }
                />
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="available"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.8125rem] font-medium text-ink-fg">Trạng thái bán</span>
              <div className="flex items-center gap-3">
                <Switch checked={field.value} onChange={field.onChange} label="Đang bán" />
                <span className="text-sm text-ink-muted">
                  {field.value ? 'Món này đang được bán' : 'Món này tạm ngưng bán'}
                </span>
              </div>
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
