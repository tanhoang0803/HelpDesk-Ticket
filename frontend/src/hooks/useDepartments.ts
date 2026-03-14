import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { departmentsService, categoriesService, ticketTypesService } from '@/services/departments.service';

export const useDepartments = () => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['departments'],
    queryFn:  departmentsService.getAll,
    enabled:  status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategories = (departmentId?: string) => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['categories', departmentId],
    queryFn:  () => categoriesService.getAll(departmentId),
    enabled:  status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
};

export const useTicketTypes = () => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['ticket-types'],
    queryFn:  ticketTypesService.getAll,
    enabled:  status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
};
