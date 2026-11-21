'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { Settings } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { queryKeys } from '@/lib/query-keys';

const schema = z
  .object({
    pinThresholdCredits: z
      .number()
      .int('Phải là số nguyên')
      .min(0, 'Không được âm')
      .max(10_000, 'Giá trị quá lớn'),
    topUpMinCredits: z
      .number()
      .int('Phải là số nguyên')
      .min(1, 'Nạp tối thiểu ít nhất 1 xu')
      .max(100_000, 'Giá trị quá lớn'),
    topUpMaxCredits: z
      .number()
      .int('Phải là số nguyên')
      .min(1, 'Nạp tối đa ít nhất 1 xu')
      .max(100_000, 'Giá trị quá lớn'),
    topUpExpiryMinutes: z
      .number()
      .int('Phải là số nguyên')
      .min(5, 'Tối thiểu 5 phút')
      .max(1440, 'Tối đa 1.440 phút'),
    bank: z.object({
      bankName: z.string().trim().min(1, 'Nhập tên ngân hàng').max(50, 'Tên quá dài'),
      accountNumber: z.string().trim().min(1, 'Nhập số tài khoản').max(30, 'Số quá dài'),
      accountHolder: z.string().trim().min(1, 'Nhập chủ tài khoản').max(100, 'Tên quá dài'),
    }),
  })
  .refine((values) => values.topUpMinCredits <= values.topUpMaxCredits, {
    path: ['topUpMaxCredits'],
    message: 'Nạp tối đa phải lớn hơn hoặc bằng nạp tối thiểu',
  });

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const api = useApi();
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.admin.getSettings(),
  });

  return (
    <>
      <PageHeader
        title="Cài đặt"
        description="Quy tắc thanh toán và tài khoản nhận tiền của nhà trường."
      />
      {settings.isPending ? (
        <LoadingBlock className="min-h-80" />
      ) : settings.error ? (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void settings.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(settings.error)}
        </Notice>
      ) : (
        <SettingsForm initial={settings.data} />
      )}
    </>
  );
}

function SettingsForm({ initial }: { initial: Settings }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => api.admin.updateSettings(values),
    onSuccess: (data) => {
      toast.success('Đã lưu cài đặt');
      reset(data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const numberField = (
    name: 'pinThresholdCredits' | 'topUpMinCredits' | 'topUpMaxCredits' | 'topUpExpiryMinutes',
    label: string,
    hint: string,
    suffix: string,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field label={label} hint={hint} error={fieldState.error?.message}>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              suffix={suffix}
              value={Number.isNaN(field.value) ? '' : field.value}
              onChange={(event) =>
                field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
              }
            />
          )}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title="Quy tắc thanh toán" description="Áp dụng cho toàn nhà trường" />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          {numberField(
            'pinThresholdCredits',
            'Ngưỡng yêu cầu mã PIN',
            'Đơn hàng lớn hơn mức này cần PIN',
            'xu',
          )}
          {numberField('topUpMinCredits', 'Nạp tối thiểu', 'Số xu nạp mỗi lần', 'xu')}
          {numberField('topUpMaxCredits', 'Nạp tối đa', 'Số xu nạp mỗi lần', 'xu')}
          {numberField('topUpExpiryMinutes', 'Thời hạn mã nạp', 'Mã nạp hết hạn sau', 'phút')}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Tài khoản nhận tiền" description="Thông tin chuyển khoản SePay" />
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Controller
            control={control}
            name="bank.bankName"
            render={({ field, fieldState }) => (
              <Field label="Ngân hàng" error={fieldState.error?.message}>
                {(props) => <Input {...props} {...field} placeholder="VD: MBBank" maxLength={50} />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="bank.accountNumber"
            render={({ field, fieldState }) => (
              <Field label="Số tài khoản" error={fieldState.error?.message}>
                {(props) => <Input {...props} {...field} maxLength={30} />}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="bank.accountHolder"
            render={({ field, fieldState }) => (
              <Field
                label="Chủ tài khoản"
                hint="Viết hoa, không dấu"
                error={fieldState.error?.message}
              >
                {(props) => <Input {...props} {...field} maxLength={100} />}
              </Field>
            )}
          />
        </div>
      </Panel>

      <p className="text-[0.8125rem] text-ink-muted">Mọi thay đổi được ghi vào nhật ký thao tác.</p>

      {formState.isDirty && (
        <div className="workbook-panel sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="text-sm font-medium text-ink-fg">Bạn có thay đổi chưa lưu</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={save.isPending} onClick={() => reset(initial)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={save.isPending}>
              Lưu cài đặt
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
