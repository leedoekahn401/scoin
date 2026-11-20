'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ImportStudentsResult } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  Modal,
  Notice,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useState } from 'react';

import { queryKeys } from '@/lib/query-keys';

const SAMPLE_CSV = 'Mã học sinh,Họ tên,Lớp,Ảnh\n7A001,Nguyễn Văn A,7A1,\n7A002,Trần Thị B,7A1,';
const SAMPLE_URL = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`;

export function StudentImportDialog({ onClose }: { onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<ImportStudentsResult | null>(null);

  const importCsv = useMutation({
    mutationFn: (text: string) => api.admin.importStudents(text),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Đã thêm ${data.created} học sinh`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Nhập danh sách học sinh"
      size="lg"
      closeDisabled={importCsv.isPending}
      footer={
        result ? (
          <Button variant="primary" data-primary onClick={onClose}>
            Đóng
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={importCsv.isPending}>
              Hủy
            </Button>
            <Button
              variant="primary"
              data-primary
              loading={importCsv.isPending}
              disabled={csv.trim() === ''}
              onClick={() => importCsv.mutate(csv)}
            >
              Nhập học sinh
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink-fg">
            Đã thêm {result.created} học sinh trong {result.rows.length} dòng.
          </p>
          {result.rows.length === 0 ? (
            <Notice tone="info">Không có dòng nào được xử lý.</Notice>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Dòng</TH>
                  <TH>Mã</TH>
                  <TH>Kết quả</TH>
                </tr>
              </THead>
              <TBody>
                {result.rows.map((row) => (
                  <TR key={`${row.line}-${row.studentCode}`}>
                    <TD muted className="tabular">
                      {row.line}
                    </TD>
                    <TD className="font-mono">{row.studentCode}</TD>
                    <TD>
                      {row.ok ? (
                        <span className="text-success">✓ Đã thêm</span>
                      ) : (
                        <span className="text-danger">{row.error ?? 'Không hợp lệ'}</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Mỗi dòng: mã học sinh, họ tên, lớp, ảnh (không bắt buộc)
          </p>
          <a
            href={SAMPLE_URL}
            download="hoc-sinh-mau.csv"
            className="w-fit text-sm font-medium text-brand-deep underline"
          >
            Tải file mẫu
          </a>
          <Field label="Chọn file CSV" optional>
            {() => (
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void file.text().then((text) => setCsv(text));
                }}
              />
            )}
          </Field>
          <Field label="Hoặc dán nội dung" hint="Mỗi dòng là một học sinh.">
            {() => (
              <Textarea
                rows={7}
                value={csv}
                placeholder="7A001,Nguyễn Văn A,7A1"
                onChange={(event) => setCsv(event.target.value)}
                className="font-mono text-xs"
              />
            )}
          </Field>
        </div>
      )}
    </Modal>
  );
}
