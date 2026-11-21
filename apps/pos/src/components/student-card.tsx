'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { isApiError } from '@schoolcoin/api-client';
import type { PosLookupResult } from '@schoolcoin/types';
import {
  Avatar,
  Button,
  DEMO_TOOLS,
  Field,
  IconButton,
  Input,
  Money,
  Notice,
  Select,
  errorMessage,
  formatCredits,
  useCardScanner,
} from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

interface StudentCardProps {
  student: (PosLookupResult & { cardCode: string }) | null;
  onStudent: (student: (PosLookupResult & { cardCode: string }) | null) => void;
  scanEnabled: boolean;
}

export function StudentCard({ student, onStudent, scanEnabled }: StudentCardProps) {
  const api = useApi();
  const [manualCode, setManualCode] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!student) setLookupError(null);
  }, [student]);

  const demoCards = useQuery({
    queryKey: queryKeys.demoCards,
    queryFn: () => api.dev.demoCards(),
    enabled: DEMO_TOOLS && !student,
  });

  async function lookup(code: string) {
    const trimmed = code.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setLookupError(null);
    try {
      const result = await api.pos.lookup({ cardCode: trimmed });
      onStudent({ ...result, cardCode: trimmed });
      setManualCode('');
    } catch (err) {
      if (isApiError(err, 'CARD_NOT_FOUND') || isApiError(err, 'CARD_INACTIVE')) {
        setLookupError('Thẻ không hợp lệ — vui lòng đến văn phòng.');
      } else {
        setLookupError(errorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  useCardScanner((code) => void lookup(code), { enabled: scanEnabled && !student && !pending });

  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStudent(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [student, onStudent]);

  if (student) {
    return (
      <div className="border-b border-border p-5">
        <div className="flex items-start gap-4">
          <Avatar size="xl" shape="rounded" name={student.fullName} src={student.photoUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold leading-tight tracking-tight text-ink-fg">
                  {student.fullName}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">Lớp {student.className}</p>
              </div>
              <IconButton label="Đổi học sinh (Esc)" onClick={() => onStudent(null)}>
                <X />
              </IconButton>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <Money size="lg" credits={student.balance} />
              <span className="pb-1 text-right text-[0.8125rem] text-ink-muted">
                {student.remainingToday === null ? (
                  'Không giới hạn ngày'
                ) : (
                  <>
                    Hôm nay còn
                    <span className="block text-sm font-semibold tabular text-ink-fg">
                      {formatCredits(student.remainingToday)}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-col gap-3 rounded-[var(--ui-radius)] border border-dashed border-border-strong bg-paper-bg p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-fg">
          <ScanLine className="size-5 text-ink-muted" />
          Quét thẻ học sinh
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(manualCode);
          }}
        >
          <Field label="Nhập mã thẻ" className="min-w-0 flex-1">
            {(p) => (
              <Input
                {...p}
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setLookupError(null);
                }}
                placeholder="Nhập mã thẻ"
                disabled={pending}
              />
            )}
          </Field>
          <Button
            type="submit"
            variant="secondary"
            disabled={pending || manualCode.trim().length === 0}
          >
            Tìm
          </Button>
        </form>
        {DEMO_TOOLS && demoCards.data && demoCards.data.length > 0 && (
          <Field label="Thẻ demo">
            {(p) => (
              <Select
                {...p}
                defaultValue=""
                onChange={(e) => {
                  const code = e.target.value;
                  if (code) void lookup(code);
                  e.target.value = '';
                }}
              >
                <option value="">Chọn thẻ demo</option>
                {demoCards.data.map((card) => (
                  <option key={card.cardCode} value={card.cardCode}>
                    {card.fullName} · {card.className}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        {lookupError && <Notice tone="danger">{lookupError}</Notice>}
      </div>
    </div>
  );
}
