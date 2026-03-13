import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private repo: CategoriesRepository) {}

  findAll(departmentId?: string) {
    return this.repo.findAll(departmentId);
  }

  async findById(id: string) {
    const cat = await this.repo.findById(id);
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  create(dto: CreateCategoryDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }
}
