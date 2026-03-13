import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';

export class UpdateTicketDto extends PartialType(OmitType(CreateTicketDto, ['assignedToId'] as const)) {}
