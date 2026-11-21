'use client';

import type { CreditRequest } from '@schoolcoin/types';
import {
  Avatar,
  Badge,
  Button,
  Money,
  Panel,
  REQUEST_STATUS,
  formatRelative,
} from '@schoolcoin/ui';

export function RequestCard({
  request,
  onApprove,
  onDecline,
}: {
  request: CreditRequest;
  onApprove: (request: CreditRequest) => void;
  onDecline: (request: CreditRequest) => void;
}) {
  const decided =
    request.status === 'APPROVED' || request.status === 'DECLINED' || request.status === 'PAID';

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <Avatar name={request.studentName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold tracking-tight text-ink-fg">
                  {request.studentName}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
                  {formatRelative(request.createdAt)}
                </p>
              </div>
              <Badge tone={REQUEST_STATUS[request.status].tone}>
                {REQUEST_STATUS[request.status].label}
              </Badge>
            </div>
          </div>
        </div>

        <Money credits={request.amountCredits} size="lg" />

        {request.note && <p className="text-sm italic text-ink-muted">“{request.note}”</p>}

        {decided && request.decidedByName && request.decidedAt && (
          <p className="text-[0.8125rem] text-ink-muted">
            {request.decidedByName} đã {request.status === 'DECLINED' ? 'từ chối' : 'đồng ý'} ·{' '}
            {formatRelative(request.decidedAt)}
          </p>
        )}
        {request.declineReason && (
          <p className="rounded-[var(--ui-radius-sm)] bg-paper-bg px-3 py-2 text-[0.8125rem] text-ink-muted">
            Lý do: {request.declineReason}
          </p>
        )}
      </div>

      {request.status === 'PENDING' && (
        <div className="grid grid-cols-2 gap-2 border-t border-border bg-paper-bg/60 px-5 py-4">
          <Button variant="primary" size="lg" fullWidth onClick={() => onApprove(request)}>
            Đồng ý &amp; nạp
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => onDecline(request)}>
            Từ chối
          </Button>
        </div>
      )}
    </Panel>
  );
}
