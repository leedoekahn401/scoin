'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { DAILY_LIMIT_MAX, DAILY_LIMIT_MIN, type ChildDetail } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  Panel,
  PanelHeader,
  Switch,
  errorMessage,
  formatNumber,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

export function ControlsForm({ child }: { child: ChildDetail }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [dailyOn, setDailyOn] = useState(child.dailyLimitCredits !== null);
  const [dailyValue, setDailyValue] = useState(String(child.dailyLimitCredits ?? 100));
  const [lowOn, setLowOn] = useState(child.lowBalanceThreshold !== null);
  const [lowValue, setLowValue] = useState(String(child.lowBalanceThreshold ?? 20));

  const dailyNumber = Number(dailyValue);
  const lowNumber = Number(lowValue);
  const dailyError =
    dailyOn &&
    (!Number.isInteger(dailyNumber) ||
      dailyNumber < DAILY_LIMIT_MIN ||
      dailyNumber > DAILY_LIMIT_MAX)
      ? `Nhập số xu từ ${formatNumber(DAILY_LIMIT_MIN)} đến ${formatNumber(DAILY_LIMIT_MAX)}.`
      : undefined;
  const lowError =
    lowOn && (!Number.isInteger(lowNumber) || lowNumber < 1 || lowNumber > 10_000)
      ? 'Nhập mức cảnh báo từ 1 đến 10.000 xu.'
      : undefined;

  const save = useMutation({
    mutationFn: () =>
      api.parent.updateControls(child.studentId, {
        dailyLimitCredits: dailyOn ? dailyNumber : null,
        lowBalanceThreshold: lowOn ? lowNumber : null,
      }),
    onSuccess: () => {
      toast.success('Đã lưu thiết lập');
      void queryClient.invalidateQueries({ queryKey: queryKeys.child(child.studentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.children });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Panel>
      <PanelHeader
        title="Hạn mức & cảnh báo"
        description={
          child.coParents.length > 0
            ? `Cùng quản lý với ${child.coParents.map((parent) => parent.fullName).join(', ')}`
            : undefined
        }
      />
      <form
        className="flex flex-col gap-5 px-5 py-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!dailyError && !lowError) save.mutate();
        }}
      >
        <Field
          label="Giới hạn chi tiêu mỗi ngày"
          hint="Áp dụng từ lần mua tiếp theo, chung cho cả hai phụ huynh"
          error={dailyError}
        >
          {({ id, ...props }) => (
            <div className="flex items-center gap-2">
              <Switch
                checked={dailyOn}
                onChange={setDailyOn}
                label="Bật giới hạn chi tiêu mỗi ngày"
              />
              <Input
                {...props}
                id={id}
                type="number"
                inputMode="numeric"
                min={DAILY_LIMIT_MIN}
                max={DAILY_LIMIT_MAX}
                suffix="xu"
                value={dailyValue}
                disabled={!dailyOn}
                onChange={(event) => setDailyValue(event.target.value)}
              />
            </div>
          )}
        </Field>

        <Field
          label="Cảnh báo khi số dư dưới"
          hint="Bạn sẽ nhận một thông báo khi số dư xuống dưới mức này"
          error={lowError}
        >
          {({ id, ...props }) => (
            <div className="flex items-center gap-2">
              <Switch checked={lowOn} onChange={setLowOn} label="Bật cảnh báo số dư thấp" />
              <Input
                {...props}
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={10_000}
                suffix="xu"
                value={lowValue}
                disabled={!lowOn}
                onChange={(event) => setLowValue(event.target.value)}
              />
            </div>
          )}
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={save.isPending}
          disabled={Boolean(dailyError || lowError)}
        >
          Lưu thiết lập
        </Button>
      </form>
    </Panel>
  );
}
