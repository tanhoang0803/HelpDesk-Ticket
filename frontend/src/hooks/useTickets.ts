import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ticketsService } from '@/services/tickets.service';
import { ListTicketsParams, CreateTicketInput } from '@/types/ticket.types';

export const useTickets = (params: ListTicketsParams = {}) => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['tickets', params],
    queryFn:  () => ticketsService.getAll(params),
    enabled:  status === 'authenticated',
    staleTime: 30_000,
  });
};

export const useTicket = (id: string) => {
  const { status } = useSession();
  return useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => ticketsService.getById(id),
    enabled:  status === 'authenticated' && !!id,
    staleTime: 15_000,
  });
};

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => ticketsService.create(input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
};

export const useTransitionTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, comment }: { status: string; comment?: string }) =>
      ticketsService.transition(id, status, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};

export const useAddComment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => ticketsService.addComment(id, comment),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  });
};
