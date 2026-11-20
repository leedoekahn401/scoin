'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Capability, MAX_PARENTS_PER_STUDENT, can } from '@schoolcoin/types';
import type { CreateInviteResult, StudentDetailAdmin } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Panel,
  PanelHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatDateTime,
  toast,
} from '@schoolcoin/ui';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';
import { InviteDialog } from './invite-dialog';

export function StudentFamilyPanel({ student }: { student: StudentDetailAdmin }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const editable = can(user?.role, Capability.MANAGE_STUDENTS);
  const [unlinkId, setUnlinkId] = useState<string | null>(null);
  const [invite, setInvite] = useState<CreateInviteResult | null>(null);
  const full = student.parents.length >= MAX_PARENTS_PER_STUDENT;

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.student(student.id) });

  const unlink = useMutation({
    mutationFn: (parentId: string) => api.admin.unlinkParent(student.id, parentId),
    onSuccess: () => {
      toast.success('Đã gỡ liên kết phụ huynh');
      refresh();
      setUnlinkId(null);
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setUnlinkId(null);
    },
  });

  const createInvite = useMutation({
    mutationFn: () => api.admin.createInvite(student.id),
    onSuccess: (result) => {
      setInvite(result);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Panel className="lg:col-span-3">
      <PanelHeader
        title="Phụ huynh"
        description={`${student.parents.length}/${MAX_PARENTS_PER_STUDENT} phụ huynh đã liên kết`}
        actions={
          <div className="flex items-center gap-2">
            {editable && full && (
              <span className="text-xs text-ink-muted">Học sinh đã đủ 2 phụ huynh</span>
            )}
            {editable && (
              <Button
                variant="primary"
                size="sm"
                disabled={full}
                loading={createInvite.isPending}
                onClick={() => createInvite.mutate()}
              >
                Tạo mã mời
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-col gap-5 px-5 py-5">
        {student.parents.length === 0 ? (
          <EmptyState title="Chưa có phụ huynh liên kết" description="Tạo mã mời để liên kết." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Họ tên</TH>
                <TH>Email</TH>
                <TH>Điện thoại</TH>
                <TH>Liên kết ngày</TH>
                <TH align="right">Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {student.parents.map((parent) => (
                <TR key={parent.id}>
                  <TD>
                    <span className="font-medium">{parent.fullName}</span>
                  </TD>
                  <TD muted>{parent.email ?? '—'}</TD>
                  <TD muted>{parent.phone ?? '—'}</TD>
                  <TD muted className="tabular">
                    {formatDateTime(parent.linkedAt)}
                  </TD>
                  <TD align="right">
                    {editable ? (
                      <Button variant="ghost" size="sm" onClick={() => setUnlinkId(parent.id)}>
                        Gỡ liên kết
                      </Button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-[0.8125rem] font-medium text-ink-fg">Mã mời đã tạo</h3>
          {student.invites.length === 0 ? (
            <p className="text-[0.8125rem] text-ink-muted">Chưa có mã mời nào.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-[var(--ui-radius)] border border-border px-3">
              {student.invites.map((item) => (
                <li key={item.code} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="font-mono text-sm text-ink-fg">{item.code}</span>
                  <Badge tone={item.usedAt ? 'neutral' : 'success'}>
                    {item.usedAt ? 'Đã dùng' : 'Chưa dùng'}
                  </Badge>
                  <span className="text-xs text-ink-muted">
                    Hết hạn {formatDateTime(item.expiresAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={unlinkId !== null}
        onClose={() => setUnlinkId(null)}
        onConfirm={() => (unlinkId ? unlink.mutate(unlinkId) : setUnlinkId(null))}
        title="Gỡ liên kết phụ huynh"
        description="Phụ huynh sẽ không còn xem được thông tin của học sinh này."
        confirmLabel="Gỡ liên kết"
        destructive
        loading={unlink.isPending}
      />
      {invite && <InviteDialog result={invite} onClose={() => setInvite(null)} />}
    </Panel>
  );
}
