import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { agentsService } from '@/services/agents.service';

export const useAgents = (params?: { departmentId?: string; isActive?: boolean }) => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['agents', params],
    queryFn:  () => agentsService.getAll(params),
    enabled:  status === 'authenticated',
    staleTime: 2 * 60 * 1000,
  });
};
