import { TicketStatus, Priority } from './ticket.types';

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  granularity?: 'day' | 'week' | 'month';
}

// Overview KPIs
export interface OverviewData {
  statusDistribution: StatusCount[];
  openTickets: number;
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;
  resolutionRatePercent: number;
  avgResolutionHours: number;
}

export interface StatusCount {
  status: TicketStatus;
  count: number;
}

// Ticket Volume
export interface VolumeBucket {
  bucket: string;  // ISO date string
  count: number;
}

// Priority Distribution
export interface PriorityCount {
  priority: Priority;
  count: number;
  percent: number;
}

// Department Breakdown
export interface DepartmentCount {
  department: string;
  count: number;
  percent: number;
}

// Resolution Time Trend
export interface ResolutionBucket {
  bucket: string;  // ISO date string
  avgHours: number;
  count: number;
}

// Agent Load
export interface AgentLoadRow {
  agentId: string;
  agentName: string;
  department: string;
  assigned: number;
  resolved: number;
  avgResolutionHours: number | null;
}
