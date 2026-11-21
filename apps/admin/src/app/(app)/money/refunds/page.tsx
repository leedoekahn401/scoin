'use client';

import { useSession } from '@schoolcoin/api-client/react';
import { Capability, can } from '@schoolcoin/types';
import { LoadingBlock, PageHeader, Tabs } from '@schoolcoin/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AdjustmentForm } from '@/components/b/adjustment-form';
import { AdjustmentHistory } from '@/components/b/adjustment-history';
import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { RefundForm } from '@/components/b/refund-form';
import { RefundHistory } from '@/components/b/refund-history';

type RefundTab = 'refund' | 'adjust';
type TabOption = { value: RefundTab; label: string; count?: number };

const tabs: readonly TabOption[] = [
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'adjust', label: 'Điều chỉnh số dư' },
];

export default function RefundsPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.MANAGE_MONEY)) {
    return <ForbiddenNotice title="Hoàn tiền & điều chỉnh" />;
  }
  return (
    <Suspense fallback={<LoadingBlock className="min-h-80" />}>
      <RefundsScreen />
    </Suspense>
  );
}

function RefundsScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawStudentId = searchParams.get('studentId');
  const initialStudentId = rawStudentId || undefined;
  const tab: RefundTab = searchParams.get('tab') === 'adjust' ? 'adjust' : 'refund';

  function changeTab(next: RefundTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <PageHeader
        title="Hoàn tiền & điều chỉnh"
        description="Ghi nhận các thao tác tác động đến số dư ví học sinh."
      />
      <Tabs tabs={tabs} value={tab} onChange={changeTab} className="mb-6" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {tab === 'refund' ? (
          <>
            <RefundForm initialStudentId={initialStudentId} />
            <RefundHistory />
          </>
        ) : (
          <>
            <AdjustmentForm initialStudentId={initialStudentId} />
            <AdjustmentHistory />
          </>
        )}
      </div>
    </>
  );
}
