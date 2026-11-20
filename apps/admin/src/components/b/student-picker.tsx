'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { StudentDetailAdmin, StudentListItem } from '@schoolcoin/types';
import {
  Avatar,
  Button,
  EmptyState,
  LoadingBlock,
  Money,
  Notice,
  SearchInput,
  Skeleton,
  errorMessage,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function toListItem(detail: StudentDetailAdmin): StudentListItem {
  const activeCard = detail.cards.find((card) => card.status === 'ACTIVE');
  return {
    ...detail,
    balanceCredits: detail.wallet.balanceCredits,
    cardStatus: activeCard?.status ?? null,
    parentCount: detail.parents.length,
  };
}

export function StudentPicker({
  value,
  onChange,
  initialStudentId,
}: {
  value: StudentListItem | null;
  onChange: (student: StudentListItem | null) => void;
  initialStudentId?: string;
}) {
  const api = useApi();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 250);
  const notifiedId = useRef<string | null>(null);

  const initialQuery = useQuery({
    queryKey: queryKeys.student(initialStudentId ?? ''),
    queryFn: () => api.admin.getStudent(initialStudentId ?? ''),
    enabled: Boolean(initialStudentId),
  });

  const initialItem = useMemo(
    () => (initialQuery.data ? toListItem(initialQuery.data) : null),
    [initialQuery.data],
  );

  useEffect(() => {
    if (!initialItem || notifiedId.current === initialItem.id) return;
    notifiedId.current = initialItem.id;
    onChange(initialItem);
  }, [initialItem, onChange]);

  const results = useQuery({
    queryKey: queryKeys.students({ search: debouncedSearch, active: true, pageSize: 8 }),
    queryFn: () =>
      api.admin.listStudents({
        search: debouncedSearch || undefined,
        active: true,
        pageSize: 8,
      }),
    enabled: open && !value,
  });

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--ui-radius)] border border-border bg-paper-bg px-3 py-2">
        <Avatar name={value.fullName} src={value.photoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-fg">{value.fullName}</p>
          <p className="truncate text-xs text-ink-muted">
            {value.className} · {value.studentCode}
          </p>
        </div>
        <Money credits={value.balanceCredits} size="sm" showVnd={false} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(null);
            setSearch('');
            setOpen(true);
          }}
        >
          Đổi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={search}
        onChange={(next) => {
          setSearch(next);
          setOpen(true);
        }}
        placeholder="Tìm học sinh theo tên, lớp hoặc mã…"
        autoFocus={open}
      />

      {initialStudentId && initialQuery.isPending && <Skeleton className="h-9" />}
      {initialStudentId && initialQuery.isError && (
        <Notice
          tone="danger"
          action={
            <Button size="sm" onClick={() => void initialQuery.refetch()}>
              Thử lại
            </Button>
          }
        >
          {errorMessage(initialQuery.error)}
        </Notice>
      )}

      {open && (
        <div
          role="listbox"
          aria-label="Kết quả học sinh"
          className="workbook-panel max-h-72 divide-y divide-border overflow-y-auto"
        >
          {results.isPending ? (
            <LoadingBlock />
          ) : results.error ? (
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void results.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(results.error)}
            </Notice>
          ) : (results.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title="Không tìm thấy học sinh"
              description="Thử tìm theo tên, lớp hoặc mã học sinh khác."
            />
          ) : (
            results.data?.items.map((student) => (
              <button
                key={student.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(student);
                  setOpen(false);
                  setSearch('');
                }}
                className="workbook-press flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper-bg"
              >
                <Avatar name={student.fullName} src={student.photoUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-fg">
                    {student.fullName}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {student.className} · {student.studentCode}
                  </span>
                </span>
                <Money credits={student.balanceCredits} size="sm" showVnd={false} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
