import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsRepository } from './departments.repository';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsRepository],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
