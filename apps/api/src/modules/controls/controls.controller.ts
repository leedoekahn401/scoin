import { Controller, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { ControlsService } from './controls.service';

/** BE-2 — FR-CTL-01…03 */
@ApiTags('parent: controls')
@Roles(...PERMISSIONS.OWN_CHILDREN)
@Controller('parent/children/:studentId/controls')
export class ControlsController {
  constructor(private readonly controlsService: ControlsService) {}

  /** {dailyLimitCredits, lowBalanceThreshold}; null turns a control off. */
  @Patch()
  update() {
    notImplemented('FR-CTL-01');
  }
}
