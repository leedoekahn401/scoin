import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_KEY, type AuditMeta } from '../decorators/audit.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/** Writes an AuditLog row after a successful @Audit route (FR-AUD-01). */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(AUDIT_KEY, ctx.getHandler());
    if (!meta) return next.handle();

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return next.handle().pipe(
      tap(async (result) => {
        const entityId =
          typeof result === 'object' && result !== null && 'id' in result
            ? String(result.id)
            : String(req.params.id ?? '');
        await this.prisma.auditLog.create({
          data: {
            action: meta.action,
            entity: meta.entity,
            entityId,
            actorId: req.user?.id,
            after: (result ?? undefined) as Prisma.InputJsonValue | undefined,
            ip: req.ip,
          },
        });
      }),
    );
  }
}
