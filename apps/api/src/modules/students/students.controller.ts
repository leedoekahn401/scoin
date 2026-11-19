import { Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { StudentsService } from './students.service';

/** BE-2 — FR-ADM-01, FR-ADM-03, and the parent's view of linked children (UC-03). */
@ApiTags('students')
@Controller()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ---- parent (FR-FAM-04: only linked children)

  /** Linked children with balance. */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/children')
  myChildren() {
    notImplemented('UC-03');
  }

  /** Balance, today's spending, controls, card status. */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/children/:studentId')
  child() {
    notImplemented('UC-03');
  }

  /** ?from&to&type&page — ledger with order items. */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/children/:studentId/transactions')
  transactions() {
    notImplemented('UC-03');
  }

  // ---- admin

  @Roles(...PERMISSIONS.STUDENTS)
  @Get('admin/students')
  list() {
    notImplemented('FR-ADM-01');
  }

  /** Creates the student and a 0-credit wallet (FR-WAL-01). */
  @Roles(...PERMISSIONS.STUDENTS)
  @Post('admin/students')
  create() {
    notImplemented('FR-ADM-01');
  }

  /** CSV upload (student code, full name, class, optional photo); per-row result. */
  @Roles(...PERMISSIONS.STUDENTS)
  @Post('admin/students/import')
  import() {
    notImplemented('FR-ADM-01');
  }

  @Roles(...PERMISSIONS.STUDENTS)
  @Get('admin/students/:id')
  get() {
    notImplemented('FR-ADM-01');
  }

  /** Edit or deactivate; deactivation needs a 0 balance (BR-14). */
  @Roles(...PERMISSIONS.STUDENTS)
  @Patch('admin/students/:id')
  update() {
    notImplemented('FR-ADM-01');
  }

  @Roles(...PERMISSIONS.STUDENTS)
  @Put('admin/students/:id/pin')
  setPin() {
    notImplemented('FR-ADM-03');
  }
}
