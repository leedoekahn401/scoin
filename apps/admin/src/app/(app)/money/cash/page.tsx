'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { CashTopUpReceipt, StudentListItem } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import {
  AmountPicker,
  Button,
  Field,
  Input,
  KeyValue,
  LoadingBlock,
  Money,
  PageHeader,
  Panel,
  PanelHeader,
  errorMessage,
  formatCreditsWithVnd,
  formatDateTime,
  formatNumber,
  toast,
} from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { StudentPicker } from '@/components/b/student-picker';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  studentId: z.string().min(1, 'Chọn học sinh'),
  amountCredits: z
    .number()
    .int('Số xu phải là số nguyên')
    .min(1, 'Số xu tối thiểu là 1')
    .max(100_000, 'Số xu tối đa là 100.000'),
  note: z.string().trim().max(200, 'Ghi chú quá dài').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CashTopUpPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.MANAGE_MONEY)) {
    return <ForbiddenNotice title="Nạp tiền mặt" />;
  }
  return (
    <Suspense fallback={<LoadingBlock className="min-h-80" />}>
      <CashTopUpScreen />
    </Suspense>
  );
}

function CashTopUpScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('studentId') ?? undefined;
  const [student, setStudent] = useState<StudentListItem | null>(null);
  const [receipt, setReceipt] = useState<CashTopUpReceipt | null>(null);
  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: '', amountCredits: 0, note: '' },
  });
  const amount = watch('amountCredits');

  const topUp = useMutation({
    mutationFn: (values: FormValues) =>
      api.admin.cashTopUp({
        studentId: values.studentId,
        amountCredits: values.amountCredits,
        note: values.note,
      }),
    onSuccess: (result) => {
      toast.success('Đã nạp xu cho học sinh');
      setReceipt(result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function startAnother() {
    setReceipt(null);
    setStudent(null);
    reset();
  }

  return (
    <>
      <PageHeader
        title="Nạp tiền mặt"
        description="Ghi nhận tiền mặt nhận tại văn phòng và cộng xu vào ví học sinh."
      />

      {receipt ? (
        <Panel className="print:fixed print:inset-0 print:z-[999] print:max-h-none print:overflow-auto print:rounded-none print:border-0 print:bg-surface-white print:p-8 print:shadow-none">
          <PanelHeader
            title="Biên nhận nạp tiền"
            description="Giữ lại để đối chiếu khi cần"
            actions={<span className="no-print text-xs text-ink-muted">Biên nhận hệ thống</span>}
          />
          <div className="flex flex-col gap-5 px-5 py-5">
            <p className="font-mono text-lg font-semibold tabular text-ink-fg">
              Biên nhận {receipt.receiptNumber}
            </p>
            <KeyValue
              items={[
                { label: 'Học sinh', value: receipt.studentName },
                {
                  label: 'Số xu nạp',
                  value: (
                    <span className="tabular">{formatCreditsWithVnd(receipt.amountCredits)}</span>
                  ),
                },
                {
                  label: 'Số dư sau nạp',
                  value: (
                    <span className="tabular">{formatCreditsWithVnd(receipt.balanceAfter)}</span>
                  ),
                },
                { label: 'Thu ngân', value: receipt.createdByName },
                {
                  label: 'Thời gian',
                  value: <span className="tabular">{formatDateTime(receipt.createdAt)}</span>,
                },
                ...(receipt.note ? [{ label: 'Ghi chú', value: receipt.note }] : []),
              ]}
            />
            <div className="no-print flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                In biên nhận
              </Button>
              <Button variant="primary" onClick={startAnother}>
                Nạp lượt khác
              </Button>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel className="lg:col-span-2">
            <PanelHeader title="Thông tin nạp" description="Chọn học sinh và số xu cần cộng" />
            <form
              onSubmit={handleSubmit((values) => topUp.mutate(values))}
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
                  <Field label="Số xu nạp" error={fieldState.error?.message}>
                    {() => (
                      <AmountPicker
                        presets={[50, 100, 200, 500]}
                        value={typeof field.value === 'number' ? field.value : null}
                        onChange={(next) => field.onChange(next ?? 0)}
                        min={1}
                        max={100_000}
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
                        placeholder="Ví dụ: nhận tiền từ phụ huynh"
                      />
                    )}
                  </Field>
                )}
              />
              {student && (
                <div className="rounded-[var(--ui-radius)] border border-border bg-paper-bg px-4 py-3">
                  <p className="text-xs text-ink-muted">Số dư hiện tại</p>
                  <Money credits={student.balanceCredits} size="md" />
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={topUp.isPending}
                disabled={amount <= 0}
              >
                {amount > 0 ? (
                  <span className="tabular">Nạp {formatNumber(amount)} xu</span>
                ) : (
                  'Nạp xu'
                )}
              </Button>
            </form>
          </Panel>

          <Panel className="lg:col-span-3">
            <PanelHeader
              title="Lượt nạp tiền mặt gần đây"
              description="Thông tin đối chiếu nhanh"
            />
            <div className="flex flex-col gap-3 px-5 py-5 text-sm text-ink-muted">
              <p>
                Mỗi lượt nạp sẽ tạo một biên nhận riêng. Biên nhận hiển thị ngay sau khi lưu và có
                thể in trực tiếp.
              </p>
              <p>
                Tiền mặt được thu ngoài hệ thống; hệ thống chỉ ghi nhận số xu đã cộng cho học sinh.
              </p>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
