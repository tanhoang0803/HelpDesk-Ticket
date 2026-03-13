import { Injectable } from '@nestjs/common';
import { TrackingRepository } from './tracking.repository';

interface LogActionParams {
  ticketId: string;
  action: string;
  comment?: string;
  departmentId?: string;
  agentId?: string;
  verified?: boolean;
}

@Injectable()
export class TrackingService {
  constructor(private repo: TrackingRepository) {}

  log(params: LogActionParams) {
    return this.repo.create(params);
  }

  getHistory(ticketId: string) {
    return this.repo.findByTicketId(ticketId);
  }
}
