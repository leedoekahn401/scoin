import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

// Field list: SRS B6 / https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook

/** Payload SePay POSTs to /webhooks/sepay. */
export class SepayWebhookDto {
  @ApiProperty() @IsInt() id: number;
  @ApiProperty() @IsString() gateway: string;
  @ApiProperty() @IsString() transactionDate: string;
  @ApiProperty() @IsString() accountNumber: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() code?: string | null;
  @ApiProperty() @IsString() content: string;
  @ApiProperty({ enum: ['in', 'out'] }) @IsIn(['in', 'out']) transferType: 'in' | 'out';
  @ApiProperty() @IsInt() transferAmount: number;
  @ApiProperty() @IsInt() accumulated: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() subAccount?: string | null;
  @ApiProperty() @IsString() referenceCode: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
}
