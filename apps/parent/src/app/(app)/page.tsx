'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import {
  Button,
  EmptyState,
  LinkButton,
  LoadingBlock,
  Notice,
  PageHeader,
  errorMessage,
  formatWeekdayDate,
  givenName,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { UsersRound } from 'lucide-react';
import { useState } from 'react';

import { ChildCard } from '@/components/child-card';
import { LinkChildDialog } from '@/components/link-child-dialog';
import { queryKeys } from '@/lib/query-keys';

export default function ChildrenPage() {
  const api = useApi();
  const { user } = useSession();
  const [linkOpen, setLinkOpen] = useState(false);

  const children = useQuery({
    queryKey: queryKeys.children,
    queryFn: () => api.parent.listChildren(),
  });
  const topUps = useQuery({
    queryKey: queryKeys.topUps,
    queryFn: () => api.parent.listTopUps(),
  });

  const pendingTopUp = topUps.data?.find(
    (topUp) => topUp.status === 'PENDING' && Date.parse(topUp.expiresAt) > Date.now(),
  );

  return (
    <>
      <PageHeader
        title={`Chào ${givenName(user?.fullName ?? '')}`}
        description={formatWeekdayDate(new Date())}
        actions={
          <Button variant="ghost" onClick={() => setLinkOpen(true)}>
            Liên kết thêm con
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
        {topUps.isPending ? (
          <LoadingBlock className="min-h-20" />
        ) : topUps.error ? (
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
        ) : null}

        {pendingTopUp && (
          <Notice
            tone="brand"
            title="Bạn có một giao dịch nạp đang chờ thanh toán"
            action={
              <LinkButton href={`/topup/${pendingTopUp.id}`} size="sm" variant="primary">
                Tiếp tục
              </LinkButton>
            }
          >
            Hoàn tất chuyển khoản để xu được cộng vào ví của con.
          </Notice>
        )}

        {children.isPending ? (
          <LoadingBlock className="min-h-64" />
        ) : children.error ? (
          <Notice
            tone="danger"
            action={
              <Button size="sm" onClick={() => void children.refetch()}>
                Thử lại
              </Button>
            }
          >
            {errorMessage(children.error)}
          </Notice>
        ) : children.data && children.data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {children.data.map((child) => (
              <ChildCard key={child.studentId} child={child} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UsersRound />}
            title="Chưa có học sinh nào được liên kết"
            description="Dùng mã mời của nhà trường để liên kết với con và bắt đầu nạp xu."
            action={
              <Button variant="secondary" onClick={() => setLinkOpen(true)}>
                Liên kết thêm con
              </Button>
            }
          />
        )}

        <div className="flex justify-center">
          <LinkButton href="/topups" variant="ghost" size="sm">
            Xem lịch sử nạp xu
          </LinkButton>
        </div>
      </div>

      <LinkChildDialog open={linkOpen} onClose={() => setLinkOpen(false)} />
    </>
  );
}
