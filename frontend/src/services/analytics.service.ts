import apiClient from '@/lib/api-client';
import {
  AnalyticsQuery, OverviewData, VolumeBucket,
  PriorityCount, DepartmentCount, ResolutionBucket, AgentLoadRow,
} from '@/types/analytics.types';

function toParams(q: AnalyticsQuery) {
  const params: Record<string, string> = {};
  if (q.startDate)    params.startDate    = q.startDate;
  if (q.endDate)      params.endDate      = q.endDate;
  if (q.departmentId) params.departmentId = q.departmentId;
  if (q.granularity)  params.granularity  = q.granularity;
  return params;
}

async function get<T>(path: string, q: AnalyticsQuery): Promise<T> {
  const { data } = await apiClient.get(path, { params: toParams(q) });
  return data.data ?? data;
}

export const analyticsService = {
  getOverview:             (q: AnalyticsQuery) => get<OverviewData>('/api/analytics/overview', q),
  getTicketVolume:         (q: AnalyticsQuery) => get<VolumeBucket[]>('/api/analytics/ticket-volume', q),
  getPriorityDistribution: (q: AnalyticsQuery) => get<PriorityCount[]>('/api/analytics/priority-distribution', q),
  getDepartmentBreakdown:  (q: AnalyticsQuery) => get<DepartmentCount[]>('/api/analytics/department-breakdown', q),
  getResolutionTimeTrend:  (q: AnalyticsQuery) => get<ResolutionBucket[]>('/api/analytics/resolution-time', q),
  getAgentLoad:            (q: AnalyticsQuery) => get<AgentLoadRow[]>('/api/analytics/agent-load', q),
};
