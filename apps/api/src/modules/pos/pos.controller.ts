import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { CreateOrderDto } from './dto/create-order.dto';
import { PosService } from './pos.service';

/** BE-2 — FR-POS-01…09, UC-08, UC-09 */
@ApiTags('pos')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  /** Categories with available items (FR-POS-01). */
  @Roles(...PERMISSIONS.POS_CHARGE)
  @Get('menu')
  menu() {
    notImplemented('FR-POS-01');
  }

  /** {cardCode} → studentId, fullName, className, photoUrl, balance, remainingToday, pinThreshold. */
  @Roles(...PERMISSIONS.POS_CHARGE)
  @Post('lookup')
  @HttpCode(200)
  lookup() {
    notImplemented('FR-POS-04');
  }

  /**
   * 201 order, or 422 with CARD_INACTIVE, PIN_REQUIRED, PIN_INVALID, PIN_LOCKED,
   * INSUFFICIENT_BALANCE, DAILY_LIMIT_REACHED or ITEM_UNAVAILABLE.
   */
  @Roles(...PERMISSIONS.POS_CHARGE)
  @Post('orders')
  charge(@Body() _dto: CreateOrderDto) {
    notImplemented('FR-POS-06');
  }

  /** Today's orders: own for a cashier, all for a manager or admin. */
  @Roles(...PERMISSIONS.VOID_OWN_ORDER)
  @Get('orders')
  today() {
    notImplemented('FR-POS-08');
  }

  /** {reason} — same day only; cashiers only their own orders (FR-POS-07, BR-10). */
  @Roles(...PERMISSIONS.VOID_OWN_ORDER)
  @Post('orders/:id/void')
  @HttpCode(200)
  void() {
    notImplemented('FR-POS-07');
  }
}
