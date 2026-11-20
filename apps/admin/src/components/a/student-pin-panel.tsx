'use client';

import { useSession } from '@schoolcoin/api-client/react';
import type { StudentDetailAdmin } from '@schoolcoin/types';
import { Capability, can } from '@schoolcoin/types';
import { Badge, Button, Panel, PanelHeader, formatDateTime } from '@schoolcoin/ui';
import { useState } from 'react';

import { PinDialog } from './pin-dialog';

export function StudentPinPanel({ student }: { student: StudentDetailAdmin }) {
  const { user } = useSession();
  const editable = can(user?.role, Capability.MANAGE_STUDENTS);
  const [open, setOpen] = useState(false);

  return (
    <Panel>
      <PanelHeader title="Mã PIN" description="Mã PIN chỉ đặt lại, không hiển thị lại" />
      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex items-center gap-2">
          <Badge tone={student.hasPin ? 'success' : 'warning'}>
            {student.hasPin ? 'Đã đặt' : 'Chưa đặt'}
          </Badge>
          {student.pinLockedUntil && (
            <span className="text-xs text-danger">
              Tạm khóa đến {formatDateTime(student.pinLockedUntil)}
            </span>
          )}
        </div>
        {editable && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {student.hasPin ? 'Đặt lại mã PIN' : 'Đặt mã PIN'}
          </Button>
        )}
      </div>
      {open && (
        <PinDialog studentId={student.id} hasPin={student.hasPin} onClose={() => setOpen(false)} />
      )}
    </Panel>
  );
}
