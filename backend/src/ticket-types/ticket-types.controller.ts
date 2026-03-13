import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AgentRole } from '../common/enums/agent-role.enum';

@ApiTags('Ticket Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private service: TicketTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all ticket types' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket type by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Create ticket type (Admin only)' })
  create(@Body() dto: CreateTicketTypeDto) {
    return this.service.create(dto);
  }
}
