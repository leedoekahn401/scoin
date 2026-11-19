import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PosService } from './pos.service';

@ApiTags('pos')
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}
}
