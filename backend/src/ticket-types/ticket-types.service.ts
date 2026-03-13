import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TicketTypesRepository } from './ticket-types.repository';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(private repo: TicketTypesRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const tt = await this.repo.findById(id);
    if (!tt) throw new NotFoundException(`Ticket type ${id} not found`);
    return tt;
  }

  async create(dto: CreateTicketTypeDto) {
    const existing = await this.repo.findByName(dto.name);
    if (existing) throw new ConflictException(`Ticket type "${dto.name}" already exists`);
    return this.repo.create(dto);
  }
}
