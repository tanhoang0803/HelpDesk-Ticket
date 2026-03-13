import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingRepository } from './tracking.repository';

@Module({
  providers: [TrackingService, TrackingRepository],
  exports: [TrackingService],
})
export class TrackingModule {}
