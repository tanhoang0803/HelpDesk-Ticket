import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTrackingLogData {
  ticketId: string;
  action: string;
  comment?: string;
  departmentId?: string;
  agentId?: string;
  verified?: boolean;
}

const LOG_SELECT = {
  id: true, action: true, comment: true, verified: true, createdAt: true,
  agent:      { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
};

@Injectable()
export class TrackingRepository {
  constructor(private prisma: PrismaService) {}

  create(data: CreateTrackingLogData) {
    return this.prisma.trackingLog.create({
      data: {
        ticketId:     data.ticketId,
        action:       data.action as any,
        comment:      data.comment,
        departmentId: data.departmentId,
        agentId:      data.agentId,
        verified:     data.verified ?? false,
      },
      select: LOG_SELECT,
    });
  }

  findByTicketId(ticketId: string) {
    return this.prisma.trackingLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      select: LOG_SELECT,
    });
  }
}
