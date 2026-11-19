import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import type { AuthUser } from '../decorators/current-user.decorator';

/** Writes an AuditLog row after a successful @Audit route. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string | undefined>(AUDIT_KEY, ctx.getHandler());
    if (!action) return next.handle();

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return next.handle().pipe(
      tap(async (result) => {
        const entityId =
          typeof result === 'object' && result !== null && 'id' in result
            ? String(result.id)
            : undefined;
        await this.prisma.auditLog.create({
          data: {
            action,
            actorId: req.user?.id,
            entityId,
            data: { params: req.params, body: req.body },
            ip: req.ip,
          },
        });
      }),
    );
  }
}
