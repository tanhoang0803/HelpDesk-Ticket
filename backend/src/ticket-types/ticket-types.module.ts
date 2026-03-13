import { Module } from '@nestjs/common';
import { TicketTypesService } from './ticket-types.service';
import { TicketTypesController } from './ticket-types.controller';
import { TicketTypesRepository } from './ticket-types.repository';

@Module({
  controllers: [TicketTypesController],
  providers: [TicketTypesService, TicketTypesRepository],
  exports: [TicketTypesService],
})
export class TicketTypesModule {}
