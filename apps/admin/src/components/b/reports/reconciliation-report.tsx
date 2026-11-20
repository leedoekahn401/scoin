'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { VND_PER_CREDIT } from '@schoolcoin/types';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  Panel,
  PanelHeader,
  Stat,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatCredits,
  formatDateTime,
  formatNumber,
  formatVnd,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

export function ReconciliationReport({ from, to }: { from: string; to: string }) {
  const api = useApi();
  const report = useQuery({
    queryKey: queryKeys.reconciliation(from, to),
    queryFn: () => api.admin.reconciliationReport({ from, to }),
  });

  if (report.isPending) return <LoadingBlock className="min-h-80" />;
  if (report.error) {
    return (
      <Notice
        tone="danger"
        action={
          <Button size="sm" onClick={() => void report.refetch()}>
            Thử lại
          </Button>
        }
      >
        {errorMessage(report.error)}
      </Notice>
    );
  }
  const data = report.data;
  if (!data) return <EmptyState title="Không có dữ liệu đối soát" />;
  const expectedVnd = data.creditedCredits * VND_PER_CREDIT;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat emphasis label="Tiền nhận" value={formatVnd(data.receivedVnd)} />
        <Stat label="Xu đã cộng" value={formatCredits(data.creditedCredits)} />
        <Stat label="Phần lẻ" value={formatVnd(data.remainderVnd)} />
        <Stat
          label="Chưa khớp / Bỏ qua"
          value={`${formatNumber(data.unmatchedCount)} / ${formatNumber(data.ignoredCount)}`}
          sub={<span className="tabular">{formatNumber(data.matchedCount)} khoản đã khớp</span>}
        />
      </div>

      <Notice tone="info">
        <span className="tabular">
          Tiền thực nhận là {formatVnd(data.receivedVnd)}, trong đó{' '}
          {formatCredits(data.creditedCredits)} đã quy đổi thành {formatVnd(expectedVnd)}. Phần
          chênh lệch là {formatVnd(data.receivedVnd - expectedVnd)}.
        </span>
      </Notice>

      {data.unmatched.length === 0 && data.ignored.length === 0 ? (
        <EmptyState title="Không có giao dịch cần đối soát" />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Chưa khớp"
              description={<span className="tabular">{data.unmatched.length} giao dịch</span>}
            />
            <Table>
              <THead>
                <tr>
                  <TH>Thời gian</TH>
                  <TH align="right">Số tiền</TH>
                  <TH>Nội dung</TH>
                </tr>
              </THead>
              <TBody>
                {data.unmatched.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="!py-8 text-center text-sm text-ink-muted">
                      Không còn giao dịch chưa khớp.
                    </td>
                  </tr>
                ) : (
                  data.unmatched.map((row) => (
                    <TR key={row.id}>
                      <TD muted className="tabular">
                        {formatDateTime(row.transactionDate)}
                      </TD>
                      <TD align="right">{formatVnd(row.amountVnd)}</TD>
                      <TD className="max-w-64 break-words font-mono text-xs">{row.content}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </Panel>

          <Panel>
            <PanelHeader
              title="Đã bỏ qua"
              description={<span className="tabular">{data.ignored.length} giao dịch</span>}
            />
            <Table>
              <THead>
                <tr>
                  <TH>Thời gian</TH>
                  <TH align="right">Số tiền</TH>
                  <TH>Lý do</TH>
                </tr>
              </THead>
              <TBody>
                {data.ignored.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="!py-8 text-center text-sm text-ink-muted">
                      Không có giao dịch bị bỏ qua.
                    </td>
                  </tr>
                ) : (
                  data.ignored.map((row) => (
                    <TR key={row.id}>
                      <TD muted className="tabular">
                        {formatDateTime(row.transactionDate)}
                      </TD>
                      <TD align="right">{formatVnd(row.amountVnd)}</TD>
                      <TD muted className="max-w-64 truncate">
                        {row.reason ?? '—'}
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </Panel>
        </div>
      )}
    </div>
  );
}
