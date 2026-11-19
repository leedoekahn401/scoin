import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}
}
