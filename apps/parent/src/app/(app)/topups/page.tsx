'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  Badge,
  Button,
  EmptyState,
  LinkButton,
  LoadingBlock,
  Money,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  TBody,
  TD,
  TH,
  THead,
  TOPUP_STATUS,
  TR,
  Table,
  errorMessage,
  formatWhen,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import Link from 'next/link';

import { queryKeys } from '@/lib/query-keys';

export default function TopUpsPage() {
  const api = useApi();
  const topUps = useQuery({
    queryKey: queryKeys.topUps,
    queryFn: () => api.parent.listTopUps(),
  });

  return (
    <>
      <PageHeader
        back={{ href: '/account', label: 'Tài khoản' }}
        title="Lịch sử nạp xu"
        description="Các giao dịch nạp xu gần đây."
      />

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Giao dịch"
          description="Chạm vào giao dịch đang chờ để tiếp tục thanh toán"
        />
        {topUps.isPending ? (
          <LoadingBlock className="min-h-56" />
        ) : topUps.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void topUps.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(topUps.error)}
            </Notice>
          </div>
        ) : !topUps.data || topUps.data.length === 0 ? (
          <EmptyState
            icon={<Landmark />}
            title="Chưa có giao dịch nạp xu"
            description="Lượt nạp xu gần đây sẽ xuất hiện tại đây."
            action={
              <LinkButton href="/topup" variant="secondary">
                Nạp xu
              </LinkButton>
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Thời gian</TH>
                <TH align="right">Số xu</TH>
                <TH>Trạng thái</TH>
              </tr>
            </THead>
            <TBody>
              {topUps.data.map((topUp) => (
                <TR key={topUp.id}>
                  <TD>
                    {topUp.status === 'PENDING' ? (
                      <Link
                        href={`/topup/${topUp.id}`}
                        className="workbook-press font-medium text-ink-fg hover:underline"
                      >
                        {topUp.studentName}
                      </Link>
                    ) : (
                      <span className="font-medium">{topUp.studentName}</span>
                    )}
                  </TD>
                  <TD muted className="tabular">
                    {formatWhen(topUp.createdAt)}
                  </TD>
                  <TD align="right">
                    <Money credits={topUp.amountCredits} inline showVnd={false} />
                  </TD>
                  <TD>
                    <Badge tone={TOPUP_STATUS[topUp.status].tone}>
                      {TOPUP_STATUS[topUp.status].label}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
