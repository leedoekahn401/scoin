'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { StudentListItem } from '@schoolcoin/types';
import {
  Badge,
  Button,
  CARD_STATUS,
  Checkbox,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  SearchInput,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { PrintCard } from '@/components/a/print-card';
import { useDebouncedValue } from '@/components/a/use-debounced';
import { queryKeys } from '@/lib/query-keys';

export default function CardsPage() {
  return (
    <Suspense fallback={<LoadingBlock className="min-h-80" />}>
      <CardsScreen />
    </Suspense>
  );
}

function CardsScreen() {
  const api = useApi();
  const searchParams = useSearchParams();
  const initialIds = useMemo(
    () => (searchParams.get('ids') ?? '').split(',').filter(Boolean),
    [searchParams],
  );
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const students = useQuery({
    queryKey: queryKeys.students({ printable: true }),
    queryFn: () => api.admin.listStudents({ pageSize: 200 }),
  });

  const all = students.data?.items ?? [];
  const classes = Array.from(new Set(all.map((s) => s.className))).sort((a, b) =>
    a.localeCompare(b, 'vi'),
  );
  const keyword = debouncedSearch.trim().toLowerCase();
  const filtered = all.filter((student) => {
    const matchClass = !className || student.className === className;
    const matchSearch =
      !keyword ||
      student.fullName.toLowerCase().includes(keyword) ||
      student.studentCode.toLowerCase().includes(keyword);
    return matchClass && matchSearch;
  });
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedKey = useMemo(() => [...selected].sort().join(','), [selected]);

  const cards = useQuery({
    queryKey: queryKeys.students({ printIds: selectedKey }),
    queryFn: () => api.admin.printCards(selectedKey ? selectedKey.split(',') : []),
    enabled: selected.length > 0,
  });

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function selectVisible() {
    setSelected((current) => Array.from(new Set([...current, ...filtered.map((s) => s.id)])));
  }

  const printable = cards.data ?? [];

  return (
    <>
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          aside, header { display: none !important; }
          main { padding: 0 !important; }
          .lg\\:pl-\\[var\\(--sidebar-w\\)\\] { padding-left: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          title="In thẻ học sinh"
          description="Chọn học sinh để xem trước và in thẻ đúng kích thước."
          actions={
            <Button
              variant="primary"
              leadingIcon={<Printer />}
              disabled={printable.length === 0}
              onClick={() => window.print()}
            >
              In {printable.length} thẻ
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Panel>
            <PanelHeader
              title="Chọn học sinh"
              description={`Đã chọn ${selected.length} học sinh`}
              actions={
                <>
                  <Button variant="ghost" size="sm" onClick={selectVisible}>
                    Chọn cả lớp
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selected.length === 0}
                    onClick={() => setSelected([])}
                  >
                    Bỏ chọn
                  </Button>
                </>
              }
            />
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Tìm theo tên hoặc mã học sinh…"
                className="w-full sm:w-64"
              />
              <Select
                value={className}
                aria-label="Lọc theo lớp"
                onChange={(event) => setClassName(event.target.value)}
                className="w-40"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>

            {students.isPending ? (
              <LoadingBlock />
            ) : students.error ? (
              <div className="px-5 py-5">
                <Notice
                  tone="danger"
                  action={
                    <Button size="sm" onClick={() => void students.refetch()}>
                      Thử lại
                    </Button>
                  }
                >
                  {errorMessage(students.error)}
                </Notice>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState title="Không tìm thấy học sinh" description="Thử đổi từ khóa hoặc lớp." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH className="w-10">
                      <span className="sr-only">Chọn</span>
                    </TH>
                    <TH>Học sinh</TH>
                    <TH>Lớp</TH>
                    <TH>Thẻ</TH>
                  </tr>
                </THead>
                <TBody>
                  {filtered.map((student: StudentListItem) => (
                    <TR key={student.id} selected={selectedSet.has(student.id)}>
                      <TD>
                        <Checkbox
                          checked={selectedSet.has(student.id)}
                          onChange={() => toggle(student.id)}
                          label={<span className="sr-only">Chọn {student.fullName}</span>}
                        />
                      </TD>
                      <TD>
                        <span className="block font-medium">{student.fullName}</span>
                        <span className="block font-mono text-xs text-ink-muted">
                          {student.studentCode}
                        </span>
                      </TD>
                      <TD>{student.className}</TD>
                      <TD>
                        {student.cardStatus ? (
                          <Badge tone={CARD_STATUS[student.cardStatus].tone}>
                            {CARD_STATUS[student.cardStatus].label}
                          </Badge>
                        ) : (
                          <span className="text-ink-muted">Chưa có thẻ</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Xem trước" description="Thẻ hiển thị đúng 85,6 × 54 mm" />
            <div className="px-5 py-5">
              {selected.length === 0 ? (
                <EmptyState
                  title="Chưa chọn học sinh"
                  description="Chọn học sinh để xem trước thẻ."
                />
              ) : cards.isPending ? (
                <LoadingBlock />
              ) : cards.error ? (
                <Notice
                  tone="danger"
                  action={
                    <Button size="sm" onClick={() => void cards.refetch()}>
                      Thử lại
                    </Button>
                  }
                >
                  {errorMessage(cards.error)}
                </Notice>
              ) : printable.length === 0 ? (
                <EmptyState title="Không có thẻ để in" />
              ) : (
                <div className="flex max-h-[70vh] flex-col items-start gap-5 overflow-y-auto">
                  {printable.map((card) => (
                    <PrintCard key={card.studentId} card={card} />
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-[6mm]">
          {printable.map((card) => (
            <PrintCard key={card.studentId} card={card} />
          ))}
        </div>
      </div>
    </>
  );
}
