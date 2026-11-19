import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { AuditService } from './audit.service';

/** BE-1 — FR-AUD-02 */
@ApiTags('admin: audit')
@Roles(...PERMISSIONS.SYSTEM)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /** Filter by actor, action, entity, date. */
  @Get()
  search() {
    notImplemented('FR-AUD-02');
  }
}
