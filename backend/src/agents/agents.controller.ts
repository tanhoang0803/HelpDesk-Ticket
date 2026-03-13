import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AgentRole } from '../common/enums/agent-role.enum';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List agents' })
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.agentsService.findAll({
      departmentId,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.findById(id);
  }

  @Post()
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Create agent (Admin only)' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Patch(':id')
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Update agent (Admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate agent (Admin only)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentsService.deactivate(id);
  }
}
