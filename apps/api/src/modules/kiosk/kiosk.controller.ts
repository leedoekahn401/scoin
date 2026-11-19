import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KioskService } from './kiosk.service';

@ApiTags('kiosk')
@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}
}
