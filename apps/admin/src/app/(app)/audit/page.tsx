'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { vnDate } from '@schoolcoin/types';
import {
  Button,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Notice,
  Pagination,
  PageHeader,
  Panel,
  Select,
  Table,
  TBody,
  TH,
  THead,
  errorMessage,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { AuditChanges } from '@/components/a/audit-changes';
import { queryKeys } from '@/lib/query-keys';

const ACTION_GROUPS: Record<string, string[]> = {
  all: [],
  card: ['card.'],
  pin: ['pin.'],
  menu: ['menu.'],
  money: ['wallet.', 'topup.', 'sepay.'],
  user: ['user.'],
  student: ['student.', 'family.', 'invite.', 'controls.'],
  order: ['order.'],
  settings: ['settings.', 'kiosk.'],
};

const ACTION_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'card', label: 'Thẻ' },
  { value: 'pin', label: 'Mã PIN' },
  { value: 'menu', label: 'Thực đơn' },
  { value: 'money', label: 'Ví & tiền' },
  { value: 'user', label: 'Nhân sự' },
  { value: 'student', label: 'Học sinh' },
  { value: 'order', label: 'Đơn hàng' },
  { value: 'settings', label: 'Cài đặt' },
] as const;

const PAGE_SIZE = 25;

export default function AuditPage() {
  const api = useApi();
  const [group, setGroup] = useState<string>('all');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const logs = useQuery({
    queryKey: queryKeys.audit({ all: true }),
    queryFn: () => api.admin.listAuditLogs({ pageSize: 10_000 }),
  });

  const users = useQuery({
    queryKey: queryKeys.usersAll,
    queryFn: () => api.admin.listUsers(),
  });

  const filtered = useMemo(() => {
    const prefixes = ACTION_GROUPS[group] ?? [];
    return (logs.data?.items ?? []).filter((log) => {
      if (prefixes.length > 0 && !prefixes.some((prefix) => log.action.startsWith(prefix)))
        return false;
      if (actorId && log.actorId !== actorId) return false;
      const day = vnDate(log.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [logs.data, group, actorId, from, to]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = () => setPage(1);

  return (
    <>
      <PageHeader
        title="Nhật ký thao tác"
        description="Mọi thay đổi quan trọng trong hệ thống, mới nhất trước."
      />

      <Panel>
        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Nhóm thao tác">
            {(props) => (
              <Select
                {...props}
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  resetPage();
                }}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Người thực hiện">
            {(props) => (
              <Select
                {...props}
                value={actorId}
                disabled={users.isPending || Boolean(users.error)}
                onChange={(event) => {
                  setActorId(event.target.value);
                  resetPage();
                }}
              >
                <option value="">Tất cả</option>
                {(users.data?.items ?? []).map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Từ ngày">
            {(props) => (
              <Input
                {...props}
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  resetPage();
                }}
              />
            )}
          </Field>
          <Field label="Đến ngày">
            {(props) => (
              <Input
                {...props}
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  resetPage();
                }}
              />
            )}
          </Field>
        </div>

        {logs.isPending ? (
          <LoadingBlock />
        ) : logs.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void logs.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(logs.error)}
            </Notice>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Không có nhật ký"
            description="Thử đổi bộ lọc hoặc khoảng thời gian."
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Thời gian</TH>
                  <TH>Người thực hiện</TH>
                  <TH>Hành động</TH>
                  <TH>Đối tượng</TH>
                  <TH>Thay đổi</TH>
                  <TH>IP</TH>
                </tr>
              </THead>
              <TBody>
                {pageItems.map((log) => (
                  <AuditChanges key={log.id} log={log} />
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </>
        )}
      </Panel>
    </>
  );
}
