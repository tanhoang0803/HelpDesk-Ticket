import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsRepository {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, createdAt: true },
    });
  }

  findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, createdAt: true },
    });
  }

  findByName(name: string) {
    return this.prisma.department.findUnique({ where: { name } });
  }

  create(data: CreateDepartmentDto) {
    return this.prisma.department.create({ data });
  }

  update(id: string, data: Partial<CreateDepartmentDto>) {
    return this.prisma.department.update({ where: { id }, data });
  }
}
