import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { analyticsService } from '@/services/analytics.service';
import { AnalyticsQuery } from '@/types/analytics.types';

function useAnalyticsBase() {
  const { status } = useSession();
  return { enabled: status === 'authenticated' };
}

export const useOverview = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'overview', q],
    queryFn:  () => analyticsService.getOverview(q),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
};

export const useTicketVolume = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'volume', q],
    queryFn:  () => analyticsService.getTicketVolume(q),
    staleTime: 15 * 60 * 1000,
    enabled,
  });
};

export const usePriorityDistribution = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'priority', q],
    queryFn:  () => analyticsService.getPriorityDistribution(q),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

export const useDepartmentBreakdown = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'department', q],
    queryFn:  () => analyticsService.getDepartmentBreakdown(q),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

export const useResolutionTimeTrend = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'resolution', q],
    queryFn:  () => analyticsService.getResolutionTimeTrend(q),
    staleTime: 15 * 60 * 1000,
    enabled,
  });
};

export const useAgentLoad = (q: AnalyticsQuery) => {
  const { enabled } = useAnalyticsBase();
  return useQuery({
    queryKey: ['analytics', 'agents', q],
    queryFn:  () => analyticsService.getAgentLoad(q),
    staleTime: 15 * 60 * 1000,
    enabled,
  });
};
