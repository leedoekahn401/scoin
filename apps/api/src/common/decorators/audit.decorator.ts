import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMeta {
  action: string;
  entity: string;
}

/**
 * @Audit('REFUND_CREATED', 'Refund') — AuditInterceptor writes an AuditLog row on success (FR-AUD-01).
 * Services that need an accurate "before" snapshot call AuditService directly instead.
 */
export const Audit = (action: string, entity: string) =>
  SetMetadata(AUDIT_KEY, { action, entity } satisfies AuditMeta);
