import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TransitionTicketDto } from './dto/transition-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CommentTicketDto } from './dto/comment-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List tickets (paginated + filtered)' })
  findAll(@Query() query: ListTicketsDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket with full tracking history' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket fields' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.update(id, dto, user);
  }

  @Patch(':id/transition')
  @ApiOperation({ summary: 'Transition ticket status' })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.transition(id, dto, user);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign or reassign ticket' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.assign(id, dto, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment' })
  comment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommentTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.addComment(id, dto, user);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get full tracking history' })
  async getTracking(@Param('id', ParseUUIDPipe) id: string) {
    const ticket = await this.ticketsService.findById(id);
    return (ticket as any).trackingLogs;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete ticket (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ticketsService.softDelete(id, user);
  }
}
