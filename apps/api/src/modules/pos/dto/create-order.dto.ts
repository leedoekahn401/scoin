import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderLineDto {
  @ApiProperty()
  @IsUUID()
  menuItemId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Scanned card code' })
  @IsString()
  cardCode: string;

  @ApiProperty({ type: [OrderLineDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  @ArrayMinSize(1)
  items: OrderLineDto[];

  @ApiProperty({
    required: false,
    description: 'Required when the total exceeds the PIN threshold',
  })
  @IsOptional()
  @Matches(/^\d{4}$/)
  pin?: string;

  @ApiProperty({ description: 'One per checkout; retries reuse it (NFR-REL-02)' })
  @IsUUID()
  idempotencyKey: string;
}
