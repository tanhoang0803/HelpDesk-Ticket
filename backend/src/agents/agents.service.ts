import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AgentsRepository } from './agents.repository';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private agentsRepository: AgentsRepository) {}

  findAll(filters: { departmentId?: string; role?: string; isActive?: boolean } = {}) {
    return this.agentsRepository.findAll(filters);
  }

  async findById(id: string) {
    const agent = await this.agentsRepository.findById(id);
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }

  async create(dto: CreateAgentDto) {
    const existing = await this.agentsRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { password: _, ...rest } = dto;
    return this.agentsRepository.create({ ...rest, passwordHash });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findById(id);
    return this.agentsRepository.update(id, dto as any);
  }

  async deactivate(id: string) {
    await this.findById(id);
    return this.agentsRepository.update(id, { isActive: false });
  }
}
