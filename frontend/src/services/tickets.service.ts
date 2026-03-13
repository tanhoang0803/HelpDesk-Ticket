import apiClient from '@/lib/api-client';
import { Ticket, CreateTicketInput, ListTicketsParams } from '@/types/ticket.types';
import { PaginatedResult } from '@/types/api.types';

export const ticketsService = {
  getAll: async (params: ListTicketsParams = {}): Promise<PaginatedResult<Ticket>> => {
    const { data } = await apiClient.get('/api/tickets', { params });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Ticket> => {
    const { data } = await apiClient.get(`/api/tickets/${id}`);
    return data.data ?? data;
  },

  create: async (input: CreateTicketInput): Promise<Ticket> => {
    const { data } = await apiClient.post('/api/tickets', input);
    return data.data ?? data;
  },

  transition: async (id: string, status: string, comment?: string): Promise<Ticket> => {
    const { data } = await apiClient.patch(`/api/tickets/${id}/transition`, { status, comment });
    return data.data ?? data;
  },

  assign: async (id: string, assignedToId: string | null, comment?: string): Promise<Ticket> => {
    const { data } = await apiClient.patch(`/api/tickets/${id}/assign`, { assignedToId, comment });
    return data.data ?? data;
  },

  addComment: async (id: string, comment: string): Promise<void> => {
    await apiClient.post(`/api/tickets/${id}/comments`, { comment });
  },
};
