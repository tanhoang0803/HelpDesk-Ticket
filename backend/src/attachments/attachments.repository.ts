import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: {
    ticketId: string;
    uploadedById: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  }) {
    return this.prisma.attachment.create({ data });
  }

  findByTicketId(ticketId: string) {
    return this.prisma.attachment.findMany({
      where: { ticketId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  delete(id: string) {
    return this.prisma.attachment.delete({ where: { id } });
  }
}
