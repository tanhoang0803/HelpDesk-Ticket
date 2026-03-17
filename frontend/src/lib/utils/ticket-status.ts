import { TicketStatus, Priority } from '@/types/ticket.types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN:        'Open',
  ASSIGNED:    'Assigned',
  IN_PROGRESS: 'In Progress',
  PENDING:     'Pending',
  RESOLVED:    'Resolved',
  VERIFIED:    'Verified',
  REOPENED:    'Reopened',
  ESCALATED:   'Escalated',
  CANCELLED:   'Cancelled',
  CLOSED:      'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN:        'bg-gray-100 text-gray-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  PENDING:     'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  VERIFIED:    'bg-emerald-100 text-emerald-700',
  REOPENED:    'bg-orange-100 text-orange-700',
  ESCALATED:   'bg-red-100 text-red-700',
  CANCELLED:   'bg-rose-100 text-rose-700',
  CLOSED:      'bg-slate-100 text-slate-600',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH:     'High',
  MEDIUM:   'Medium',
  LOW:      'Low',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border border-red-200',
  HIGH:     'bg-orange-100 text-orange-700 border border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW:      'bg-green-100 text-green-700 border border-green-200',
};

export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:    ['IN_PROGRESS', 'ESCALATED', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'ESCALATED'],
  PENDING:     ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED:    ['VERIFIED', 'REOPENED'],
  VERIFIED:    ['CLOSED'],
  REOPENED:    ['ASSIGNED', 'IN_PROGRESS'],
  ESCALATED:   ['IN_PROGRESS', 'CANCELLED'],
  CLOSED:      [],
  CANCELLED:   [],
};

// Statuses that only ADMIN or SUPERVISOR can set
const PRIVILEGED_TARGETS = new Set<TicketStatus>(['ASSIGNED', 'VERIFIED', 'CLOSED']);

/**
 * Returns the subset of transitions the current user is actually allowed to
 * trigger from the UI, based on their role and ticket ownership.
 *
 * @param status              Current ticket status
 * @param role                Current user's AgentRole string
 * @param isAssignedToMe      True if ticket.assignedTo.id === current user's id
 */
export function getTransitionsForRole(
  status: TicketStatus,
  role: string,
  isAssignedToMe: boolean,
): TicketStatus[] {
  const all = ALLOWED_TRANSITIONS[status] ?? [];

  if (role === 'ADMIN' || role === 'SUPERVISOR') return all;

  if (role === 'AGENT') {
    // Agents can only act on tickets assigned to them
    if (!isAssignedToMe) return [];
    // Filter out admin/supervisor-only target statuses
    return all.filter((s) => !PRIVILEGED_TARGETS.has(s));
  }

  // REQUESTER: can only cancel their own tickets
  return all.filter((s) => s === 'CANCELLED');
}
