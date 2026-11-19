import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { MenuService } from './menu.service';

/** BE-4 — FR-MENU-01…03, UC-12 */
@ApiTags('admin: menu')
@Roles(...PERMISSIONS.MENU_AND_CASHIERS)
@Controller('admin/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  categories() {
    notImplemented('FR-MENU-01');
  }

  @Post('categories')
  createCategory() {
    notImplemented('FR-MENU-01');
  }

  @Patch('categories/:id')
  updateCategory() {
    notImplemented('FR-MENU-01');
  }

  @Get('items')
  items() {
    notImplemented('FR-MENU-01');
  }

  @Post('items')
  createItem() {
    notImplemented('FR-MENU-01');
  }

  /** Price changes apply to new orders only (FR-MENU-02). */
  @Audit('MENU_ITEM_UPDATED', 'MenuItem')
  @Patch('items/:id')
  updateItem() {
    notImplemented('FR-MENU-01');
  }

  /** Sold out for today only (VN calendar day). */
  @Post('items/:id/sold-out')
  @HttpCode(200)
  soldOut() {
    notImplemented('FR-MENU-03');
  }
}
