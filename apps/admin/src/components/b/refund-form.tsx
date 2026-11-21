'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { RefundMethod } from '@schoolcoin/types';
import type { StudentListItem } from '@schoolcoin/types';
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Notice,
  Panel,
  PanelHeader,
  PillToggle,
  REFUND_METHOD,
  errorMessage,
  formatCreditsWithVnd,
  formatNumber,
  toast,
  type PillOption,
} from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { StudentPicker } from '@/components/b/student-picker';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  studentId: z.string().min(1, 'Chọn học sinh'),
  amountCredits: z.number().int('Số xu phải là số nguyên').min(1, 'Số xu tối thiểu là 1'),
  method: z.enum([RefundMethod.CASH, RefundMethod.BANK_TRANSFER]),
  note: z.string().trim().max(200, 'Ghi chú quá dài').optional(),
});

type FormValues = z.infer<typeof schema>;

const methodOptions: readonly PillOption<RefundMethod>[] = [
  { value: RefundMethod.CASH, label: 'Tiền mặt' },
  { value: RefundMethod.BANK_TRANSFER, label: 'Chuyển khoản' },
];

export function RefundForm({ initialStudentId }: { initialStudentId?: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [pending, setPending] = useState<FormValues | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: '',
      amountCredits: 0,
      method: RefundMethod.CASH,
      note: '',
    },
  });

  const refund = useMutation({
    mutationFn: (values: FormValues) => api.admin.createRefund(values),
    onSuccess: () => {
      toast.success('Đã ghi nhận hoàn tiền');
      setPending(null);
      setValue('amountCredits', 0);
      setValue('note', '');
      void queryClient.invalidateQueries({ queryKey: queryKeys.refunds });
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setPending(null);
    },
  });

  const balance = student?.balanceCredits ?? 0;

  return (
    <>
      <Panel className="lg:col-span-2">
        <PanelHeader title="Hoàn tiền" description="Trừ xu và ghi nhận cách trả tiền thực tế" />
        <form
          onSubmit={handleSubmit((values) => {
            if (!student || values.amountCredits > student.balanceCredits) {
              setError('amountCredits', {
                message: 'Số xu hoàn không được vượt quá số dư hiện có',
              });
              return;
            }
            setPending(values);
          })}
          className="flex flex-col gap-5 px-5 py-5"
        >
          <Controller
            control={control}
            name="studentId"
            render={({ field, fieldState }) => (
              <Field label="Học sinh" error={fieldState.error?.message}>
                {() => (
                  <StudentPicker
                    value={student}
                    initialStudentId={initialStudentId}
                    onChange={(next) => {
                      setStudent(next);
                      field.onChange(next?.id ?? '');
                    }}
                  />
                )}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="amountCredits"
            render={({ field, fieldState }) => (
              <Field label="Số xu hoàn" error={fieldState.error?.message}>
                {(props) => (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        {...props}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={balance || undefined}
                        suffix="xu"
                        value={field.value || ''}
                        onChange={(event) =>
                          field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!student || balance <= 0}
                        onClick={() => setValue('amountCredits', balance, { shouldValidate: true })}
                      >
                        Hoàn toàn bộ
                      </Button>
                    </div>
                    <p className="tabular text-xs text-ink-muted">
                      {student
                        ? `Số dư hiện tại: ${formatNumber(balance)} xu`
                        : 'Chọn học sinh để thấy số dư tối đa.'}
                    </p>
                  </div>
                )}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <Field label="Phương thức trả tiền">
                {() => (
                  <PillToggle
                    options={methodOptions}
                    value={field.value}
                    onChange={field.onChange}
                    ariaLabel="Phương thức hoàn tiền"
                    layoutIdPrefix="refund-method"
                  />
                )}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="note"
            render={({ field, fieldState }) => (
              <Field label="Ghi chú" optional error={fieldState.error?.message}>
                {(props) => (
                  <Input
                    {...props}
                    {...field}
                    maxLength={200}
                    placeholder="Ví dụ: hoàn tiền mặt cho phụ huynh"
                  />
                )}
              </Field>
            )}
          />
          <Notice tone="info">
            Hệ thống chỉ ghi nhận và trừ xu. Việc trả tiền thực hiện ngoài hệ thống.
          </Notice>
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
            Tiếp tục hoàn tiền
          </Button>
        </form>
      </Panel>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) refund.mutate(pending);
        }}
        title="Xác nhận hoàn tiền"
        description={
          pending ? (
            <span className="tabular">
              Hoàn {formatCreditsWithVnd(pending.amountCredits)} bằng{' '}
              {REFUND_METHOD[pending.method]}.
            </span>
          ) : undefined
        }
        confirmLabel="Xác nhận hoàn tiền"
        loading={refund.isPending}
      />
    </>
  );
}
