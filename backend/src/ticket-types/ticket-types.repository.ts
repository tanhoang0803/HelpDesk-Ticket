import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';

@Injectable()
export class TicketTypesRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.ticketType.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, createdAt: true },
    });
  }

  findById(id: string) {
    return this.prisma.ticketType.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.ticketType.findUnique({ where: { name } });
  }

  create(data: CreateTicketTypeDto) {
    return this.prisma.ticketType.create({ data });
  }
}
