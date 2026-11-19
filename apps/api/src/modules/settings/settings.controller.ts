import { Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { SettingsService } from './settings.service';

/** BE-4 — FR-ADM-05: PIN threshold, top-up min/max, top-up expiry, school bank details. */
@ApiTags('admin: settings')
@Roles(...PERMISSIONS.SYSTEM)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    notImplemented('FR-ADM-05');
  }

  @Audit('SETTINGS_UPDATED', 'Setting')
  @Put()
  update() {
    notImplemented('FR-ADM-05');
  }
}
