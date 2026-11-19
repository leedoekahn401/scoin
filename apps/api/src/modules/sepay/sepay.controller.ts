import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SepayApiKeyGuard } from '../../common/guards/sepay-apikey.guard';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { SepayService } from './sepay.service';

@ApiExcludeController()
@Controller('webhooks/sepay')
export class SepayController {
  constructor(private readonly sepayService: SepayService) {}

  /** SePay retries until it gets 2xx with { success: true }. */
  @Post()
  @HttpCode(200)
  @UseGuards(SepayApiKeyGuard)
  async receive(@Body() payload: SepayWebhookDto) {
    await this.sepayService.handleWebhook(payload);
    return { success: true };
  }
}
