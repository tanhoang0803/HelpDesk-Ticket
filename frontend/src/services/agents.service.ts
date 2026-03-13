import apiClient from '@/lib/api-client';
import { Agent } from '@/types/ticket.types';

export const agentsService = {
  getAll: async (params?: { departmentId?: string; isActive?: boolean }): Promise<Agent[]> => {
    const { data } = await apiClient.get('/api/agents', { params });
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Agent> => {
    const { data } = await apiClient.get(`/api/agents/${id}`);
    return data.data ?? data;
  },

  create: async (input: {
    name: string; email: string; password: string;
    departmentId: string; role: string;
  }): Promise<Agent> => {
    const { data } = await apiClient.post('/api/agents', input);
    return data.data ?? data;
  },

  update: async (id: string, input: Partial<{
    name: string; departmentId: string; role: string; isActive: boolean;
  }>): Promise<Agent> => {
    const { data } = await apiClient.patch(`/api/agents/${id}`, input);
    return data.data ?? data;
  },

  deactivate: async (id: string): Promise<Agent> => {
    const { data } = await apiClient.patch(`/api/agents/${id}/deactivate`);
    return data.data ?? data;
  },
};
