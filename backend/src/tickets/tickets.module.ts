import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketsRepository } from './tickets.repository';
import { TrackingModule } from '../tracking/tracking.module';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [TrackingModule, AttachmentsModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
  exports: [TicketsService],
})
export class TicketsModule {}
