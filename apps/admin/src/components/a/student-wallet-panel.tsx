'use client';

import { useSession } from '@schoolcoin/api-client/react';
import type { StudentDetailAdmin } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import { KeyValue, LinkButton, Money, Panel, PanelHeader, formatCredits } from '@schoolcoin/ui';

export function StudentWalletPanel({ student }: { student: StudentDetailAdmin }) {
  const { user } = useSession();
  const manageMoney = can(user?.role, Capability.MANAGE_MONEY);

  return (
    <Panel>
      <PanelHeader title="Ví" description="Số dư và giới hạn do phụ huynh thiết lập" />
      <div className="flex flex-col gap-4 px-5 py-5">
        <Money credits={student.wallet.balanceCredits} size="lg" />
        <KeyValue
          items={[
            {
              label: 'Giới hạn mỗi ngày',
              value:
                student.dailyLimitCredits === null
                  ? 'Chưa đặt'
                  : formatCredits(student.dailyLimitCredits),
            },
            {
              label: 'Ngưỡng số dư thấp',
              value:
                student.lowBalanceThreshold === null
                  ? 'Chưa đặt'
                  : formatCredits(student.lowBalanceThreshold),
            },
          ]}
        />
        {manageMoney && (
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/money/cash?studentId=${student.id}`} variant="primary" size="sm">
              Nạp tiền mặt
            </LinkButton>
            <LinkButton href={`/money/refunds?studentId=${student.id}`} size="sm">
              Hoàn tiền
            </LinkButton>
          </div>
        )}
      </div>
    </Panel>
  );
}
