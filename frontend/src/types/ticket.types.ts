export type TicketStatus =
  | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING'
  | 'RESOLVED' | 'VERIFIED' | 'REOPENED' | 'ESCALATED'
  | 'CANCELLED' | 'CLOSED';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TrackingAction =
  | 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'IN_PROGRESS'
  | 'PENDING' | 'COMMENTED' | 'ESCALATED' | 'RESOLVED'
  | 'VERIFIED' | 'REOPENED' | 'CANCELLED' | 'CLOSED';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  departmentId?: string;
}

export interface TicketType {
  id: string;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: Department;
}

export interface TrackingLog {
  id: string;
  action: TrackingAction;
  comment?: string;
  verified: boolean;
  createdAt: string;
  agent?: { id: string; name: string };
  department?: { id: string; name: string };
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  department: Department;
  assignedTo?: { id: string; name: string; email: string } | null;
  category: Category;
  ticketType: TicketType;
  trackingLogs?: TrackingLog[];
  attachments?: Attachment[];
}

export interface CreateTicketInput {
  title: string;
  description: string;
  departmentId: string;
  categoryId: string;
  ticketTypeId: string;
  priority?: Priority;
  assignedToId?: string;
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: Priority;
  departmentId?: string;
  assignedToId?: string;
  search?: string;
}
