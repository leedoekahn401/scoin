import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ControlsService } from './controls.service';

@ApiTags('controls')
@Controller('controls')
export class ControlsController {
  constructor(private readonly controlsService: ControlsService) {}
}
