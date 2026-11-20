'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input, Modal, errorMessage, toast } from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { queryKeys } from '@/lib/query-keys';

const schema = z
  .object({
    pin: z.string().regex(/^\d{4}$/, 'Mã PIN phải có đúng 4 chữ số'),
    confirm: z.string().regex(/^\d{4}$/, 'Nhập lại đúng 4 chữ số'),
  })
  .refine((values) => values.pin === values.confirm, {
    path: ['confirm'],
    message: 'Hai mã PIN không khớp',
  });

type FormValues = z.infer<typeof schema>;

export function PinDialog({
  studentId,
  hasPin,
  onClose,
}: {
  studentId: string;
  hasPin: boolean;
  onClose: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pin: '', confirm: '' },
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => api.admin.setPin(studentId, values.pin),
    onSuccess: () => {
      toast.success('Đã cập nhật mã PIN');
      void queryClient.invalidateQueries({ queryKey: queryKeys.student(studentId) });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={hasPin ? 'Đặt lại mã PIN' : 'Đặt mã PIN'}
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
            onClick={handleSubmit((values) => save.mutate(values))}
          >
            Lưu mã PIN
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
          name="pin"
          render={({ field, fieldState }) => (
            <Field label="Mã PIN mới" error={fieldState.error?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...field}
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  className="font-mono"
                />
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field label="Nhập lại mã PIN" error={fieldState.error?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...field}
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  className="font-mono"
                />
              )}
            </Field>
          )}
        />
        <p className="text-xs text-ink-muted">Mã PIN có 4 chữ số và không được hiển thị lại.</p>
      </form>
    </Modal>
  );
}
