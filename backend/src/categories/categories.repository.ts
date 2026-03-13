import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  findAll(departmentId?: string) {
    return this.prisma.category.findMany({
      where: departmentId ? { departmentId } : {},
      orderBy: { name: 'asc' },
      select: { id: true, name: true, departmentId: true, createdAt: true },
    });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Partial<CreateCategoryDto>) {
    return this.prisma.category.update({ where: { id }, data });
  }
}
