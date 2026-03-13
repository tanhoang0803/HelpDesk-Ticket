import {
  Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException,
} from '@nestjs/common';
import { TicketsRepository } from './tickets.repository';
import { TrackingService } from '../tracking/tracking.service';
import { MailService } from '../mail/mail.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TransitionTicketDto } from './dto/transition-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CommentTicketDto } from './dto/comment-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { ALLOWED_TRANSITIONS, TicketStatus } from '../common/enums/ticket-status.enum';
import { AgentRole } from '../common/enums/agent-role.enum';
import { TrackingAction, statusToAction } from '../common/enums/tracking-action.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class TicketsService {
  constructor(
    private ticketsRepo: TicketsRepository,
    private trackingService: TrackingService,
    private mailService: MailService,
  ) {}

  async findAll(filters: ListTicketsDto, currentUser: JwtPayload) {
    if (currentUser.role === AgentRole.AGENT) {
      filters.departmentId = currentUser.departmentId;
    }
    const result = await this.ticketsRepo.findAll(filters);
    return {
      success: true,
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findById(id: string) {
    const ticket = await this.ticketsRepo.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async create(dto: CreateTicketDto, currentUser: JwtPayload) {
    const ticketNumber = await this.ticketsRepo.generateTicketNumber();
    const ticket       = await this.ticketsRepo.create({ ...dto, ticketNumber });

    await this.trackingService.log({
      ticketId:     ticket.id,
      action:       TrackingAction.CREATED,
      agentId:      currentUser.sub,
      departmentId: currentUser.departmentId,
      comment:      'Ticket created',
    });

    if (dto.assignedToId) {
      await this.trackingService.log({
        ticketId:     ticket.id,
        action:       TrackingAction.ASSIGNED,
        agentId:      currentUser.sub,
        departmentId: currentUser.departmentId,
        comment:      'Assigned to agent on creation',
      });
    }

    // Fire-and-forget email to creator
    this.mailService.sendTicketCreated({
      to:           currentUser.email,
      ticketNumber: (ticket as any).ticketNumber,
      title:        (ticket as any).title,
      priority:     (ticket as any).priority,
    });

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, currentUser: JwtPayload) {
    const ticket = await this.findById(id);
    if (
      currentUser.role === AgentRole.AGENT &&
      (ticket as any).assignedTo?.id !== currentUser.sub
    ) {
      throw new ForbiddenException('You can only update tickets assigned to you');
    }
    return this.ticketsRepo.update(id, dto as any);
  }

  async transition(id: string, dto: TransitionTicketDto, currentUser: JwtPayload) {
    const ticket        = await this.findById(id);
    const currentStatus = (ticket as any).status as TicketStatus;
    const newStatus     = dto.status;

    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    if (
      newStatus === TicketStatus.VERIFIED &&
      currentUser.role !== AgentRole.SUPERVISOR &&
      currentUser.role !== AgentRole.ADMIN
    ) {
      throw new ForbiddenException('Only supervisors can verify tickets');
    }

    if (
      currentUser.role === AgentRole.AGENT &&
      (ticket as any).assignedTo?.id !== currentUser.sub
    ) {
      throw new ForbiddenException('You can only transition tickets assigned to you');
    }

    await this.ticketsRepo.update(id, { status: newStatus });
    await this.trackingService.log({
      ticketId:     id,
      action:       statusToAction(newStatus),
      comment:      dto.comment,
      agentId:      currentUser.sub,
      departmentId: currentUser.departmentId,
      verified:     newStatus === TicketStatus.VERIFIED,
    });

    const updated = await this.findById(id);
    const assigneeEmail = (updated as any).assignedTo?.email;
    if (assigneeEmail) {
      this.mailService.sendStatusChanged({
        to:           assigneeEmail,
        ticketNumber: (updated as any).ticketNumber,
        title:        (updated as any).title,
        newStatus,
        comment:      dto.comment,
      });
    }
    return updated;
  }

  async assign(id: string, dto: AssignTicketDto, currentUser: JwtPayload) {
    if (currentUser.role !== AgentRole.ADMIN && currentUser.role !== AgentRole.SUPERVISOR) {
      throw new ForbiddenException('Only admins and supervisors can assign tickets');
    }

    const ticket     = await this.findById(id);
    const wasAssigned = !!(ticket as any).assignedTo;
    const newStatus  = dto.assignedToId ? 'ASSIGNED' : 'OPEN';

    await this.ticketsRepo.update(id, { assignedToId: dto.assignedToId ?? null, status: newStatus });
    await this.trackingService.log({
      ticketId:     id,
      action:       wasAssigned ? TrackingAction.REASSIGNED : TrackingAction.ASSIGNED,
      comment:      dto.comment ?? (dto.assignedToId ? 'Ticket assigned' : 'Returned to queue'),
      agentId:      currentUser.sub,
      departmentId: currentUser.departmentId,
    });

    const assigned = await this.findById(id);
    const assigneeEmail = (assigned as any).assignedTo?.email;
    if (assigneeEmail) {
      this.mailService.sendTicketAssigned({
        to:           assigneeEmail,
        ticketNumber: (assigned as any).ticketNumber,
        title:        (assigned as any).title,
        agentName:    (assigned as any).assignedTo?.name ?? '',
      });
    }
    return assigned;
  }

  async addComment(id: string, dto: CommentTicketDto, currentUser: JwtPayload) {
    const ticket = await this.findById(id);
    const result = await this.trackingService.log({
      ticketId:     id,
      action:       TrackingAction.COMMENTED,
      comment:      dto.comment,
      agentId:      currentUser.sub,
      departmentId: currentUser.departmentId,
    });

    const assigneeEmail = (ticket as any).assignedTo?.email;
    if (assigneeEmail && assigneeEmail !== currentUser.email) {
      this.mailService.sendCommentAdded({
        to:           assigneeEmail,
        ticketNumber: (ticket as any).ticketNumber,
        title:        (ticket as any).title,
        comment:      dto.comment,
        agentName:    currentUser.email,
      });
    }
    return result;
  }

  async softDelete(id: string, currentUser: JwtPayload) {
    await this.findById(id);
    if (currentUser.role !== AgentRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete tickets');
    }
    await this.trackingService.log({
      ticketId:     id,
      action:       TrackingAction.CANCELLED,
      comment:      'Ticket deleted by admin',
      agentId:      currentUser.sub,
      departmentId: currentUser.departmentId,
    });
    return this.ticketsRepo.softDelete(id);
  }
}
