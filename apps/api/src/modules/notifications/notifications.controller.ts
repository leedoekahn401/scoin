import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { NotificationsService } from './notifications.service';

/** BE-4 — FR-NOT-01 */
@ApiTags('notifications')
@Roles(...PERMISSIONS.OWN_CHILDREN)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** List with unread count. */
  @Get()
  list() {
    notImplemented('FR-NOT-01');
  }

  @Patch(':id/read')
  markRead() {
    notImplemented('FR-NOT-01');
  }

  @Post('read-all')
  @HttpCode(204)
  markAllRead() {
    notImplemented('FR-NOT-01');
  }
}
