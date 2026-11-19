import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

/** @Audit('REFUND_CREATED') — AuditInterceptor writes an AuditLog row on success. */
export const Audit = (action: string) => SetMetadata(AUDIT_KEY, action);
