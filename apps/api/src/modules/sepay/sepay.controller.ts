import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PERMISSIONS, RULES } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SepayApiKeyGuard } from '../../common/guards/sepay-apikey.guard';
import { notImplemented } from '../../common/utils/todo';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { SepayService } from './sepay.service';

/** BE-3 — FR-TOP-03, 04, 06, 07; UC-15, UC-23 */
@ApiTags('sepay')
@Controller()
export class SepayController {
  constructor(private readonly sepayService: SepayService) {}

  /** SePay retries until it gets 200/201 with exactly {"success": true} (B6). */
  @ApiExcludeEndpoint()
  @Public()
  @UseGuards(SepayApiKeyGuard)
  @Throttle({ default: { limit: RULES.RATE_LIMIT_WEBHOOK, ttl: 60_000 } })
  @Post('webhooks/sepay')
  @HttpCode(200)
  async receive(@Body() payload: SepayWebhookDto) {
    await this.sepayService.handleWebhook(payload);
    return { success: true };
  }

  /** ?status=UNMATCHED&from&to */
  @Roles(...PERMISSIONS.FINANCE)
  @Get('admin/sepay-transactions')
  list() {
    notImplemented('FR-TOP-06');
  }

  /** {studentId, note?} — credits the wallet with TOPUP_SEPAY, status RESOLVED. */
  @Roles(...PERMISSIONS.FINANCE)
  @Audit('SEPAY_TX_ASSIGNED', 'SepayTransaction')
  @Post('admin/sepay-transactions/:id/assign')
  @HttpCode(200)
  assign() {
    notImplemented('FR-TOP-07');
  }

  /** {reason} */
  @Roles(...PERMISSIONS.FINANCE)
  @Audit('SEPAY_TX_IGNORED', 'SepayTransaction')
  @Post('admin/sepay-transactions/:id/ignore')
  @HttpCode(200)
  ignore() {
    notImplemented('FR-TOP-07');
  }
}
