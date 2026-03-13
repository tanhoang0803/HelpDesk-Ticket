import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsRepository {
  constructor(private prisma: PrismaService) {}

  findAll(filters: { departmentId?: string; role?: string; isActive?: boolean }) {
    return this.prisma.agent.findMany({
      where: {
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.role        && { role: filters.role as any }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.agent.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, departmentId: true, createdAt: true, updatedAt: true,
        department: { select: { id: true, name: true } },
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.agent.findUnique({ where: { email } });
  }

  create(data: Omit<CreateAgentDto, 'password'> & { passwordHash: string }) {
    return this.prisma.agent.create({
      data: {
        name:         data.name,
        email:        data.email,
        passwordHash: data.passwordHash,
        departmentId: data.departmentId,
        role:         (data.role as any) ?? 'AGENT',
      },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, departmentId: true, createdAt: true,
      },
    });
  }

  update(id: string, data: Partial<{ name: string; email: string; role: any; isActive: boolean; departmentId: string }>) {
    return this.prisma.agent.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, departmentId: true, updatedAt: true,
      },
    });
  }
}
