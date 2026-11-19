import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { CardsService } from './cards.service';

/** BE-2 — FR-ADM-02, FR-CTL-04, UC-07 */
@ApiTags('cards')
@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  /** Locks the child's active card immediately. */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/children/:studentId/card/lock')
  @HttpCode(200)
  lockByParent() {
    notImplemented('FR-CTL-04');
  }

  /** Issues a new card; the previous active card becomes REPLACED (BR-12). */
  @Roles(...PERMISSIONS.STUDENTS)
  @Audit('CARD_ISSUED', 'Card')
  @Post('admin/students/:id/cards')
  issue() {
    notImplemented('FR-ADM-02');
  }

  @Roles(...PERMISSIONS.STUDENTS)
  @Audit('CARD_LOCKED', 'Card')
  @Post('admin/cards/:id/lock')
  @HttpCode(200)
  lock() {
    notImplemented('FR-ADM-02');
  }

  /** ?studentIds=… — data for the printable card sheet. */
  @Roles(...PERMISSIONS.STUDENTS)
  @Get('admin/cards/print')
  print() {
    notImplemented('FR-ADM-02');
  }
}
