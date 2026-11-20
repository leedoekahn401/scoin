'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, addDays, can, vnDate } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  Notice,
  PageHeader,
  PillToggle,
  Tabs,
  errorMessage,
  formatDate,
  toast,
  type PillOption,
} from '@schoolcoin/ui';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BalancesReport } from '@/components/b/reports/balances-report';
import { ReconciliationReport } from '@/components/b/reports/reconciliation-report';
import { SalesReport } from '@/components/b/reports/sales-report';
import { TopUpsReport } from '@/components/b/reports/topups-report';

type RangePreset = '7' | '30' | 'month' | 'custom';
type ReportTab = 'sales' | 'topups' | 'balances' | 'reconciliation';
type TabOption = { value: ReportTab; label: string };

const rangeOptions: readonly PillOption<RangePreset>[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: 'month', label: 'Tháng này' },
  { value: 'custom', label: 'Tùy chọn' },
];

function downloadCsv(csv: string, kind: string, from: string, to: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `schoolcoin-${kind}-${from}-${to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const api = useApi();
  const { user } = useSession();
  const sales = can(user?.role, Capability.VIEW_SALES_REPORTS);
  const finance = can(user?.role, Capability.VIEW_FINANCE_REPORTS);
  const today = vnDate();
  const [preset, setPreset] = useState<RangePreset>('7');
  const [customFrom, setCustomFrom] = useState(addDays(today, -29));
  const [customTo, setCustomTo] = useState(today);
  const [tab, setTab] = useState<ReportTab>('sales');

  const range = useMemo(() => {
    if (preset === '7') return { from: addDays(today, -6), to: today };
    if (preset === '30') return { from: addDays(today, -29), to: today };
    if (preset === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
    return customFrom <= customTo
      ? { from: customFrom, to: customTo }
      : { from: customTo, to: customFrom };
  }, [customFrom, customTo, preset, today]);

  const invalidCustomRange = preset === 'custom' && customFrom > customTo;
  const activeTab: ReportTab = finance || tab === 'sales' ? tab : 'sales';

  const exportCsv = useMutation({
    mutationFn: () => api.admin.exportCsv(activeTab, range),
    onSuccess: (csv) => {
      downloadCsv(csv, activeTab, range.from, range.to);
      toast.success('Đã xuất báo cáo CSV');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const tabs: readonly TabOption[] = finance
    ? [
        { value: 'sales', label: 'Bán hàng' },
        { value: 'topups', label: 'Nạp tiền' },
        { value: 'balances', label: 'Số dư' },
        { value: 'reconciliation', label: 'Đối soát' },
      ]
    : [{ value: 'sales', label: 'Bán hàng' }];

  if (!sales) {
    return (
      <>
        <PageHeader title="Báo cáo" description="Báo cáo dành cho quản lý và kế toán." />
        <Notice tone="danger">Bạn không có quyền xem báo cáo.</Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description={
          <span className="tabular">
            Từ {formatDate(range.from)} đến {formatDate(range.to)}
          </span>
        }
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Download />}
            loading={exportCsv.isPending}
            onClick={() => exportCsv.mutate()}
          >
            Xuất CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <PillToggle
            options={rangeOptions}
            value={preset}
            onChange={setPreset}
            ariaLabel="Chọn khoảng thời gian báo cáo"
            layoutIdPrefix="report-range"
          />
          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <Field label="Từ ngày">
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                )}
              </Field>
              <Field label="Đến ngày">
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                )}
              </Field>
            </div>
          )}
        </div>
        {invalidCustomRange && (
          <Notice tone="warning">Ngày bắt đầu đang sau ngày kết thúc, hệ thống sẽ đảo lại.</Notice>
        )}
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={setTab} className="mb-6" />

      {activeTab === 'sales' && <SalesReport from={range.from} to={range.to} />}
      {activeTab === 'topups' && <TopUpsReport from={range.from} to={range.to} />}
      {activeTab === 'balances' && <BalancesReport />}
      {activeTab === 'reconciliation' && <ReconciliationReport from={range.from} to={range.to} />}
    </>
  );
}
