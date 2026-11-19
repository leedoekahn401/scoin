import { Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { UsersService } from './users.service';

/** BE-1 — FR-ADM-04. Managers may only list, create and deactivate cashiers (checked in the service). */
@ApiTags('admin: users')
@Roles(...PERMISSIONS.MENU_AND_CASHIERS)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    notImplemented('FR-ADM-04');
  }

  @Post()
  create() {
    notImplemented('FR-ADM-04');
  }

  @Patch(':id')
  update() {
    notImplemented('FR-ADM-04');
  }
}
