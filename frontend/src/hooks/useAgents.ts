import { useQuery } from '@tanstack/react-query';
import { agentsService } from '@/services/agents.service';

export const useAgents = (params?: { departmentId?: string; isActive?: boolean }) =>
  useQuery({
    queryKey: ['agents', params],
    queryFn:  () => agentsService.getAll(params),
    staleTime: 2 * 60 * 1000,
  });
