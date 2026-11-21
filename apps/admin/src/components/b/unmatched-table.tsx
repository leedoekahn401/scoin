'use client';

import { SepayTxStatus } from '@schoolcoin/types';
import type { SepayTransaction } from '@schoolcoin/types';
import {
  Badge,
  Button,
  LoadingBlock,
  Notice,
  Panel,
  PanelHeader,
  SEPAY_STATUS,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatDateTime,
  formatVnd,
} from '@schoolcoin/ui';

function resolutionText(tx: SepayTransaction): string {
  if (tx.status === SepayTxStatus.RESOLVED) {
    return `→ ${tx.studentName ?? 'Học sinh'} · ${tx.resolvedByName ?? 'Kế toán'}`;
  }
  if (tx.status === SepayTxStatus.IGNORED) {
    return tx.resolutionNote ? `Lý do: ${tx.resolutionNote}` : 'Đã bỏ qua';
  }
  if (tx.status === SepayTxStatus.MATCHED) {
    return tx.studentName ? `→ ${tx.studentName}` : 'Đã khớp tự động';
  }
  return '—';
}

export function UnmatchedTable({
  items,
  pending,
  error,
  onRetry,
  onAssign,
  onIgnore,
}: {
  items: SepayTransaction[];
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  onAssign: (tx: SepayTransaction) => void;
  onIgnore: (tx: SepayTransaction) => void;
}) {
  if (pending) return <LoadingBlock className="min-h-64" />;

  if (error) {
    return (
      <Notice
        tone="danger"
        action={
          <Button size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        }
      >
        {errorMessage(error)}
      </Notice>
    );
  }

  if (items.length === 0) {
    return (
      <Panel>
        <PanelHeader title="Danh sách giao dịch" />
        <div className="px-5 py-12 text-center text-sm text-ink-muted">
          Không có giao dịch nào trong trạng thái này.
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Danh sách giao dịch"
        description={<span className="tabular">{items.length} giao dịch</span>}
      />
      <Table>
        <THead>
          <tr>
            <TH>Thời gian</TH>
            <TH>Ngân hàng</TH>
            <TH align="right">Số tiền</TH>
            <TH>Nội dung chuyển khoản</TH>
            <TH>Trạng thái</TH>
            <TH>Xử lý</TH>
            <TH align="right">Thao tác</TH>
          </tr>
        </THead>
        <TBody>
          {items.map((tx) => (
            <TR key={tx.id}>
              <TD muted className="tabular">
                {formatDateTime(tx.transactionDate)}
              </TD>
              <TD>{tx.gateway}</TD>
              <TD align="right">{formatVnd(tx.transferAmountVnd)}</TD>
              <TD className="max-w-md break-words font-mono text-xs">{tx.content}</TD>
              <TD>
                <Badge tone={SEPAY_STATUS[tx.status].tone}>{SEPAY_STATUS[tx.status].label}</Badge>
              </TD>
              <TD muted className="max-w-64 text-xs">
                {resolutionText(tx)}
              </TD>
              <TD align="right">
                {tx.status === SepayTxStatus.UNMATCHED && (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" onClick={() => onAssign(tx)}>
                      Gán cho học sinh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onIgnore(tx)}>
                      Bỏ qua
                    </Button>
                  </div>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Panel>
  );
}
