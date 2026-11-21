'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, can } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  LinkButton,
  LoadingBlock,
  Notice,
  PageHeader,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { StudentCardsPanel } from '@/components/a/student-cards-panel';
import { StudentDialog } from '@/components/a/student-dialog';
import { StudentFamilyPanel } from '@/components/a/student-family-panel';
import { StudentPinPanel } from '@/components/a/student-pin-panel';
import { StudentTransactionsPanel } from '@/components/a/student-transactions-panel';
import { StudentWalletPanel } from '@/components/a/student-wallet-panel';
import { queryKeys } from '@/lib/query-keys';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const editable = can(user?.role, Capability.MANAGE_STUDENTS);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmActive, setConfirmActive] = useState<boolean | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const student = useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => api.admin.getStudent(id),
  });

  const setActive = useMutation({
    mutationFn: (active: boolean) => api.admin.updateStudent(id, { active }),
    onSuccess: (_, active) => {
      toast.success(active ? 'Đã kích hoạt lại học sinh' : 'Đã ngừng kích hoạt học sinh');
      setBalanceError(null);
      setConfirmActive(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.student(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
    },
    onError: (err) => {
      setConfirmActive(null);
      if (isApiError(err, 'STUDENT_HAS_BALANCE')) {
        setBalanceError(errorMessage(err));
      } else {
        setBalanceError(null);
        toast.error(errorMessage(err));
      }
    },
  });

  if (student.isPending) return <LoadingBlock className="min-h-80" />;
  if (student.error || !student.data) {
    const message = student.error ? errorMessage(student.error) : 'Không tìm thấy học sinh.';
    return (
      <>
        <PageHeader title="Học sinh" back={{ href: '/students', label: 'Học sinh' }} />
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void student.refetch()}>
              Thử lại
            </Button>
          }
        >
          {message}
        </Notice>
      </>
    );
  }

  const data = student.data;

  return (
    <>
      <PageHeader
        title={data.fullName}
        description={`${data.studentCode} · Lớp ${data.className}`}
        back={{ href: '/students', label: 'Học sinh' }}
        actions={
          editable ? (
            <>
              {!data.active && <Badge tone="neutral">Ngừng hoạt động</Badge>}
              <Button onClick={() => setEditOpen(true)}>Sửa thông tin</Button>
              <Button
                variant={data.active ? 'danger' : 'secondary'}
                onClick={() => setConfirmActive(!data.active)}
              >
                {data.active ? 'Ngừng kích hoạt' : 'Kích hoạt lại'}
              </Button>
            </>
          ) : (
            !data.active && <Badge tone="neutral">Ngừng hoạt động</Badge>
          )
        }
      />

      {balanceError && (
        <Notice
          tone="warning"
          className="mb-6"
          action={
            <LinkButton href={`/money/refunds?studentId=${data.id}`} size="sm" variant="primary">
              Hoàn tiền
            </LinkButton>
          }
        >
          {balanceError}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StudentWalletPanel student={data} />
        <StudentCardsPanel studentId={data.id} cards={data.cards} />
        <StudentPinPanel student={data} />
        <StudentFamilyPanel student={data} />
        <StudentTransactionsPanel studentId={data.id} />
      </div>

      {editOpen && <StudentDialog student={data} onClose={() => setEditOpen(false)} />}

      <ConfirmDialog
        open={confirmActive !== null}
        onClose={() => setConfirmActive(null)}
        onConfirm={() => {
          if (confirmActive !== null) setActive.mutate(confirmActive);
        }}
        title={confirmActive ? 'Kích hoạt lại học sinh' : 'Ngừng kích hoạt học sinh'}
        description={
          confirmActive
            ? 'Học sinh sẽ dùng lại thẻ và ví như bình thường.'
            : 'Học sinh sẽ không dùng được thẻ cho đến khi được kích hoạt lại.'
        }
        confirmLabel={confirmActive ? 'Kích hoạt lại' : 'Ngừng kích hoạt'}
        destructive={!confirmActive}
        loading={setActive.isPending}
      />
    </>
  );
}
