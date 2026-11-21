'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { Notification } from '@schoolcoin/types';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { NotificationRow } from '@/components/notification-row';
import { queryKeys } from '@/lib/query-keys';

export default function NotificationsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.notifications.list(),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả đã đọc');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  async function open(notification: Notification) {
    try {
      await markRead.mutateAsync(notification.id);
    } catch (err) {
      toast.error(errorMessage(err));
      return;
    }
    if (notification.type === 'NEW_REQUEST') {
      router.push('/requests');
      return;
    }
    const studentId = notification.data?.studentId;
    if (typeof studentId === 'string') router.push(`/children/${studentId}`);
  }

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Tin mới nhất về số dư và thẻ của con."
        actions={
          (notifications.data?.unreadCount ?? 0) > 0 ? (
            <Button variant="ghost" loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Đánh dấu đã đọc
            </Button>
          ) : undefined
        }
      />

      <Panel className="overflow-hidden">
        {notifications.isPending ? (
          <LoadingBlock className="min-h-56" />
        ) : notifications.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void notifications.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(notifications.error)}
            </Notice>
          </div>
        ) : !notifications.data || notifications.data.items.length === 0 ? (
          <EmptyState icon={<Bell />} title="Chưa có thông báo nào" />
        ) : (
          notifications.data.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onOpen={(next) => void open(next)}
            />
          ))
        )}
      </Panel>
    </>
  );
}
