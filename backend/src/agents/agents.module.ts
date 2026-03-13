import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AgentsRepository } from './agents.repository';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, AgentsRepository],
  exports: [AgentsService],
})
export class AgentsModule {}
