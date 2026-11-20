'use client';

import type { AuditLog } from '@schoolcoin/types';
import { TD, TR, formatDateTime } from '@schoolcoin/ui';
import { useState } from 'react';

import { auditActionLabel, changedEntries } from './audit-labels';

export function AuditChanges({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const changes = changedEntries(log.before, log.after);
  const label = auditActionLabel(log.action);

  return (
    <>
      <TR onClick={() => setOpen((value) => !value)} className={open ? 'bg-paper-bg' : undefined}>
        <TD muted className="tabular">
          {formatDateTime(log.createdAt)}
        </TD>
        <TD>{log.actorName ?? 'Hệ thống'}</TD>
        <TD>
          {label ? (
            <span className="text-sm text-ink-fg">{label}</span>
          ) : (
            <span className="font-mono text-xs text-ink-muted">{log.action}</span>
          )}
        </TD>
        <TD>
          <span className="block text-sm text-ink-fg">{log.entity}</span>
          <span className="block font-mono text-xs text-ink-muted">{log.entityId}</span>
        </TD>
        <TD>
          {changes.length === 0 ? (
            <span className="text-ink-muted">—</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {changes.slice(0, 2).map((change) => (
                <span key={change.key} className="text-xs text-ink-muted">
                  <span className="font-mono text-ink-fg">{change.key}</span>: {change.from} →{' '}
                  {change.to}
                </span>
              ))}
              {changes.length > 2 && (
                <span className="text-xs text-brand-deep">+{changes.length - 2}</span>
              )}
            </span>
          )}
        </TD>
        <TD muted className="font-mono text-xs">
          {log.ip ?? '—'}
        </TD>
      </TR>
      {open && (
        <TR>
          <TD colSpan={6}>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[0.8125rem] font-medium text-ink-muted">Trước</p>
                <pre className="workbook-scrollbar overflow-x-auto rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg p-3 font-mono text-xs leading-relaxed text-ink-fg">
                  {JSON.stringify(log.before ?? {}, null, 2)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-[0.8125rem] font-medium text-ink-muted">Sau</p>
                <pre className="workbook-scrollbar overflow-x-auto rounded-[var(--ui-radius-sm)] border border-border bg-paper-bg p-3 font-mono text-xs leading-relaxed text-ink-fg">
                  {JSON.stringify(log.after ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </TD>
        </TR>
      )}
    </>
  );
}
