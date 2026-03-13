import { useQuery } from '@tanstack/react-query';
import { departmentsService, categoriesService, ticketTypesService } from '@/services/departments.service';

export const useDepartments = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn:  departmentsService.getAll,
    staleTime: 5 * 60 * 1000,
  });

export const useCategories = (departmentId?: string) =>
  useQuery({
    queryKey: ['categories', departmentId],
    queryFn:  () => categoriesService.getAll(departmentId),
    staleTime: 5 * 60 * 1000,
  });

export const useTicketTypes = () =>
  useQuery({
    queryKey: ['ticket-types'],
    queryFn:  ticketTypesService.getAll,
    staleTime: 5 * 60 * 1000,
  });
