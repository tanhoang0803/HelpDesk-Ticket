import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private repo: DepartmentsRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const dept = await this.repo.findById(id);
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.repo.findByName(dto.name);
    if (existing) throw new ConflictException(`Department "${dto.name}" already exists`);
    return this.repo.create(dto);
  }

  async update(id: string, dto: Partial<CreateDepartmentDto>) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }
}
