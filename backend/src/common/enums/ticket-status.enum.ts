export enum TicketStatus {
  OPEN        = 'OPEN',
  ASSIGNED    = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING     = 'PENDING',
  RESOLVED    = 'RESOLVED',
  VERIFIED    = 'VERIFIED',
  REOPENED    = 'REOPENED',
  ESCALATED   = 'ESCALATED',
  CANCELLED   = 'CANCELLED',
  CLOSED      = 'CLOSED',
}

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]:        [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
  [TicketStatus.ASSIGNED]:    [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.PENDING, TicketStatus.RESOLVED, TicketStatus.ESCALATED],
  [TicketStatus.PENDING]:     [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]:    [TicketStatus.VERIFIED, TicketStatus.REOPENED],
  [TicketStatus.VERIFIED]:    [TicketStatus.CLOSED],
  [TicketStatus.REOPENED]:    [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS],
  [TicketStatus.ESCALATED]:   [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.CLOSED]:      [],
  [TicketStatus.CANCELLED]:   [],
};
