'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { Role, UserProfile } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  PillToggle,
  ROLE_LABEL,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  USER_STATUS,
  errorMessage,
  formatDateTime,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { StaffDialog } from '@/components/a/staff-dialog';
import { queryKeys } from '@/lib/query-keys';

type RoleFilter = 'all' | StaffRole;
type StaffRole = Exclude<Role, 'PARENT'>;

const ALL_ROLES: StaffRole[] = ['ADMIN', 'ACCOUNTANT', 'CAFE_MANAGER', 'CASHIER'];

export default function StaffPage() {
  const api = useApi();
  const { user } = useSession();
  const canManageStaff = can(user?.role, Capability.MANAGE_STAFF);
  const visibleRoles = canManageStaff ? ALL_ROLES : (['CASHIER'] as StaffRole[]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [dialog, setDialog] = useState<{ user: UserProfile | null } | null>(null);

  const options = [
    { value: 'all', label: 'Tất cả' },
    ...visibleRoles.map((role) => ({ value: role, label: ROLE_LABEL[role] })),
  ] as const;

  const staff = useQuery({
    queryKey: queryKeys.users({ role: roleFilter === 'all' ? undefined : roleFilter }),
    queryFn: () =>
      api.admin.listUsers(roleFilter === 'all' ? {} : { role: roleFilter, pageSize: 100 }),
  });

  return (
    <>
      <PageHeader
        title={canManageStaff ? 'Nhân sự & vai trò' : 'Tài khoản thu ngân'}
        description="Quản lý tài khoản và quyền truy cập của nhân viên."
        actions={
          <Button variant="primary" onClick={() => setDialog({ user: null })}>
            Thêm nhân viên
          </Button>
        }
      />

      <Panel>
        <div className="border-b border-border px-5 py-4">
          <PillToggle
            options={options}
            value={roleFilter}
            onChange={setRoleFilter}
            ariaLabel="Lọc theo vai trò"
            layoutIdPrefix="staff-role"
          />
        </div>

        {staff.isPending ? (
          <LoadingBlock />
        ) : staff.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void staff.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(staff.error)}
            </Notice>
          </div>
        ) : staff.data.items.length === 0 ? (
          <EmptyState title="Không có nhân viên" description="Thử đổi bộ lọc vai trò." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Họ tên</TH>
                <TH>Đăng nhập</TH>
                <TH>Vai trò</TH>
                <TH>Trạng thái</TH>
                <TH>Ngày tạo</TH>
                <TH align="right">Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {staff.data.items.map((person) => (
                <TR key={person.id}>
                  <TD>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={person.fullName} size="xs" />
                      <span className="font-medium">{person.fullName}</span>
                    </span>
                  </TD>
                  <TD className="font-mono text-xs" muted>
                    {person.email ?? person.username ?? '—'}
                  </TD>
                  <TD>
                    <Badge tone="neutral">{ROLE_LABEL[person.role]}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={USER_STATUS[person.status].tone}>
                      {USER_STATUS[person.status].label}
                    </Badge>
                  </TD>
                  <TD muted className="tabular">
                    {formatDateTime(person.createdAt)}
                  </TD>
                  <TD align="right">
                    <Button variant="ghost" size="sm" onClick={() => setDialog({ user: person })}>
                      Sửa
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      {dialog && (
        <StaffDialog
          user={dialog.user}
          roles={visibleRoles}
          canChangeRole={canManageStaff}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
