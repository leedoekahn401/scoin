'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { useQuery } from '@tanstack/react-query';
import type { StudentsQuery } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import {
  Avatar,
  Badge,
  Button,
  CARD_STATUS,
  EmptyState,
  LoadingBlock,
  Notice,
  Pagination,
  PageHeader,
  Panel,
  PillToggle,
  SearchInput,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatCredits,
} from '@schoolcoin/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { StudentDialog } from '@/components/a/student-dialog';
import { StudentImportDialog } from '@/components/a/student-import-dialog';
import { useDebouncedValue } from '@/components/a/use-debounced';
import { queryKeys } from '@/lib/query-keys';

type StatusFilter = 'active' | 'inactive';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Đang học' },
  { value: 'inactive', label: 'Ngừng' },
] as const;

export default function StudentsPage() {
  const api = useApi();
  const router = useRouter();
  const { user } = useSession();
  const editable = can(user?.role, Capability.MANAGE_STUDENTS);
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<'create' | 'import' | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const params: StudentsQuery = {
    search: debouncedSearch || undefined,
    className: className || undefined,
    active: status === 'active',
    page,
    pageSize: 25,
  };

  const query = useQuery({
    queryKey: queryKeys.students(params),
    queryFn: () => api.admin.listStudents(params),
  });

  const classesQuery = useQuery({
    queryKey: queryKeys.students({ classes: true }),
    queryFn: () => api.admin.listStudents({ pageSize: 200 }),
  });

  const classes = Array.from(
    new Set((classesQuery.data?.items ?? []).map((student) => student.className)),
  ).sort((a, b) => a.localeCompare(b, 'vi'));

  return (
    <>
      <PageHeader
        title="Học sinh"
        description="Hồ sơ, số dư và thẻ của học sinh nhà trường."
        actions={
          editable ? (
            <>
              <Button variant="secondary" onClick={() => setDialog('import')}>
                Nhập CSV
              </Button>
              <Button variant="primary" onClick={() => setDialog('create')}>
                Thêm học sinh
              </Button>
            </>
          ) : undefined
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc mã học sinh…"
            className="w-full sm:w-64"
          />
          <Select
            value={className}
            aria-label="Lọc theo lớp"
            onChange={(event) => {
              setClassName(event.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <PillToggle
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            ariaLabel="Trạng thái học sinh"
            layoutIdPrefix="students-status"
          />
        </div>

        {query.isPending ? (
          <LoadingBlock />
        ) : query.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void query.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(query.error)}
            </Notice>
          </div>
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy học sinh"
            description="Thử đổi từ khóa, lớp hoặc trạng thái."
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Lớp</TH>
                  <TH align="right">Số dư</TH>
                  <TH>Thẻ</TH>
                  <TH>Phụ huynh</TH>
                  <TH>PIN</TH>
                </tr>
              </THead>
              <TBody>
                {query.data.items.map((student) => (
                  <TR
                    key={student.id}
                    onClick={() => router.push(`/students/${student.id}`)}
                    className="cursor-pointer"
                  >
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={student.fullName} src={student.photoUrl} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{student.fullName}</span>
                          <span className="block font-mono text-xs text-ink-muted">
                            {student.studentCode}
                          </span>
                        </span>
                      </div>
                    </TD>
                    <TD>{student.className}</TD>
                    <TD align="right">{formatCredits(student.balanceCredits)}</TD>
                    <TD>
                      {student.cardStatus ? (
                        <Badge tone={CARD_STATUS[student.cardStatus].tone}>
                          {CARD_STATUS[student.cardStatus].label}
                        </Badge>
                      ) : (
                        <span className="text-ink-muted">Chưa có thẻ</span>
                      )}
                    </TD>
                    <TD className="tabular">{student.parentCount}/2</TD>
                    <TD>
                      <Badge tone={student.hasPin ? 'success' : 'warning'}>
                        {student.hasPin ? 'Đã đặt' : 'Chưa đặt'}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={25} total={query.data.total} onPage={setPage} />
          </>
        )}
      </Panel>

      {dialog === 'create' && <StudentDialog student={null} onClose={() => setDialog(null)} />}
      {dialog === 'import' && <StudentImportDialog onClose={() => setDialog(null)} />}
    </>
  );
}
