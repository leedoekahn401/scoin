'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi } from '@schoolcoin/api-client/react';
import type { StudentListItem } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  Notice,
  Panel,
  PanelHeader,
  PillToggle,
  Textarea,
  errorMessage,
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

type Direction = 'credit' | 'debit';

const schema = z.object({
  studentId: z.string().min(1, 'Chọn học sinh'),
  direction: z.enum(['credit', 'debit']),
  amountCredits: z.number().int('Số xu phải là số nguyên').min(1, 'Số xu tối thiểu là 1'),
  reason: z.string().trim().min(1, 'Nhập lý do điều chỉnh').max(200, 'Lý do quá dài'),
});

type FormValues = z.infer<typeof schema>;

const directionOptions: readonly PillOption<Direction>[] = [
  { value: 'credit', label: 'Cộng xu' },
  { value: 'debit', label: 'Trừ xu' },
];

export function AdjustmentForm({ initialStudentId }: { initialStudentId?: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: '',
      direction: 'credit',
      amountCredits: 0,
      reason: '',
    },
  });

  const adjust = useMutation({
    mutationFn: (values: FormValues) =>
      api.admin.createAdjustment({
        studentId: values.studentId,
        amountCredits: values.direction === 'credit' ? values.amountCredits : -values.amountCredits,
        reason: values.reason,
      }),
    onSuccess: () => {
      toast.success('Đã điều chỉnh số dư');
      setInlineError(null);
      setValue('amountCredits', 0);
      setValue('reason', '');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adjustments });
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (err) => {
      if (isApiError(err, 'ADJUSTMENT_NEGATIVE_BALANCE')) {
        setInlineError(errorMessage(err));
        return;
      }
      setInlineError(null);
      toast.error(errorMessage(err));
    },
  });

  return (
    <Panel className="lg:col-span-2">
      <PanelHeader title="Điều chỉnh số dư" description="Cộng hoặc trừ xu có lý do rõ ràng" />
      <form
        onSubmit={handleSubmit((values) => {
          setInlineError(null);
          adjust.mutate(values);
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
          name="direction"
          render={({ field }) => (
            <Field label="Chiều điều chỉnh">
              {() => (
                <PillToggle
                  options={directionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Chiều điều chỉnh số dư"
                  layoutIdPrefix="adjust-direction"
                />
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="amountCredits"
          render={({ field, fieldState }) => (
            <Field label="Số xu" error={fieldState.error?.message}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  suffix="xu"
                  value={field.value || ''}
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
          name="reason"
          render={({ field, fieldState }) => (
            <Field label="Lý do điều chỉnh" error={fieldState.error?.message}>
              {(props) => (
                <Textarea
                  {...props}
                  {...field}
                  maxLength={200}
                  placeholder="Ví dụ: cộng xu do lỗi hệ thống"
                />
              )}
            </Field>
          )}
        />
        {student && (
          <p className="tabular text-xs text-ink-muted">
            Số dư hiện tại: {formatNumber(student.balanceCredits)} xu
          </p>
        )}
        {inlineError && <Notice tone="danger">{inlineError}</Notice>}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={adjust.isPending}>
          Lưu điều chỉnh
        </Button>
      </form>
    </Panel>
  );
}
