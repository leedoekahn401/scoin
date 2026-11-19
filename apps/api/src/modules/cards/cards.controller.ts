import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CardsService } from './cards.service';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}
}
