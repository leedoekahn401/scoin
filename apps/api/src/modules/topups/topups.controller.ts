import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TopupsService } from './topups.service';

@ApiTags('topups')
@Controller('topups')
export class TopupsController {
  constructor(private readonly topupsService: TopupsService) {}
}
