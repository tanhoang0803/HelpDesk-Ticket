import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';

const TICKET_DETAIL_SELECT = {
  id: true, ticketNumber: true, title: true, description: true,
  priority: true, status: true, createdAt: true, updatedAt: true,
  department:  { select: { id: true, name: true } },
  assignedTo:  { select: { id: true, name: true, email: true } },
  category:    { select: { id: true, name: true } },
  ticketType:  { select: { id: true, name: true } },
  trackingLogs: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true, action: true, comment: true, verified: true, createdAt: true,
      agent:      { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  },
};

const TICKET_LIST_SELECT = {
  id: true, ticketNumber: true, title: true, description: true,
  priority: true, status: true, createdAt: true, updatedAt: true,
  department: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
  category:   { select: { id: true, name: true } },
  ticketType: { select: { id: true, name: true } },
};

@Injectable()
export class TicketsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ListTicketsDto) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (filters.status)       where['status']       = filters.status;
    if (filters.priority)     where['priority']     = filters.priority;
    if (filters.departmentId) where['departmentId'] = filters.departmentId;
    if (filters.assignedToId) where['assignedToId'] = filters.assignedToId;
    if (filters.search) {
      where['OR'] = [
        { title:        { contains: filters.search, mode: 'insensitive' } },
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        select: TICKET_LIST_SELECT,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      select: TICKET_DETAIL_SELECT,
    });
  }

  async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.prisma.$transaction(async (tx) =>
      tx.ticketCounter.upsert({
        where:  { year },
        update: { seq: { increment: 1 } },
        create: { year, seq: 1 },
      }),
    );
    return `HD-${year}-${String(counter.seq).padStart(5, '0')}`;
  }

  create(data: CreateTicketDto & { ticketNumber: string }) {
    return this.prisma.ticket.create({
      data: {
        ticketNumber: data.ticketNumber,
        title:        data.title,
        description:  data.description,
        departmentId: data.departmentId,
        categoryId:   data.categoryId,
        ticketTypeId: data.ticketTypeId,
        priority:     (data.priority as any) ?? 'MEDIUM',
        assignedToId: data.assignedToId ?? null,
        status:       data.assignedToId ? 'ASSIGNED' : 'OPEN',
      },
      select: TICKET_DETAIL_SELECT,
    });
  }

  update(id: string, data: Partial<{
    title: string; description: string; categoryId: string;
    ticketTypeId: string; priority: string; status: string; assignedToId: string | null;
  }>) {
    return this.prisma.ticket.update({
      where: { id },
      data: data as any,
      select: TICKET_LIST_SELECT,
    });
  }

  softDelete(id: string) {
    return this.prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
