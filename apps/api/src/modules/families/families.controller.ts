import { Controller, Delete, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { FamiliesService } from './families.service';

/** BE-1 — FR-FAM-01…05 */
@ApiTags('families')
@Controller()
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  /** {inviteCode} — link another child (FR-FAM-02). */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/children/link')
  link() {
    notImplemented('FR-FAM-02');
  }

  /** One-time invite code, valid 14 days (FR-FAM-01). */
  @Roles(...PERMISSIONS.STUDENTS)
  @Post('admin/students/:id/invites')
  createInvite() {
    notImplemented('FR-FAM-01');
  }

  @Roles(...PERMISSIONS.STUDENTS)
  @Delete('admin/students/:id/parents/:parentId')
  unlink() {
    notImplemented('FR-FAM-05');
  }
}
