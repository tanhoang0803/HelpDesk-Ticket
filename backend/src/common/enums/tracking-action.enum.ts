export enum TrackingAction {
  CREATED     = 'CREATED',
  ASSIGNED    = 'ASSIGNED',
  REASSIGNED  = 'REASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING     = 'PENDING',
  COMMENTED   = 'COMMENTED',
  ESCALATED   = 'ESCALATED',
  RESOLVED    = 'RESOLVED',
  VERIFIED    = 'VERIFIED',
  REOPENED    = 'REOPENED',
  CANCELLED   = 'CANCELLED',
  CLOSED      = 'CLOSED',
}

export function statusToAction(status: string): TrackingAction {
  const map: Record<string, TrackingAction> = {
    ASSIGNED:    TrackingAction.ASSIGNED,
    IN_PROGRESS: TrackingAction.IN_PROGRESS,
    PENDING:     TrackingAction.PENDING,
    RESOLVED:    TrackingAction.RESOLVED,
    VERIFIED:    TrackingAction.VERIFIED,
    REOPENED:    TrackingAction.REOPENED,
    ESCALATED:   TrackingAction.ESCALATED,
    CANCELLED:   TrackingAction.CANCELLED,
    CLOSED:      TrackingAction.CLOSED,
  };
  return map[status] ?? TrackingAction.IN_PROGRESS;
}
