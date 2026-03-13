import apiClient from '@/lib/api-client';
import { Department, Category, TicketType } from '@/types/ticket.types';

export const departmentsService = {
  getAll: async (): Promise<Department[]> => {
    const { data } = await apiClient.get('/api/departments');
    return data.data ?? data;
  },

  create: async (input: { name: string; description?: string }): Promise<Department> => {
    const { data } = await apiClient.post('/api/departments', input);
    return data.data ?? data;
  },

  update: async (id: string, input: { name?: string; description?: string }): Promise<Department> => {
    const { data } = await apiClient.patch(`/api/departments/${id}`, input);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/departments/${id}`);
  },
};

export const categoriesService = {
  getAll: async (departmentId?: string): Promise<Category[]> => {
    const { data } = await apiClient.get('/api/categories', {
      params: departmentId ? { departmentId } : {},
    });
    return data.data ?? data;
  },

  create: async (input: { name: string; departmentId?: string }): Promise<Category> => {
    const { data } = await apiClient.post('/api/categories', input);
    return data.data ?? data;
  },

  update: async (id: string, input: { name?: string; departmentId?: string }): Promise<Category> => {
    const { data } = await apiClient.patch(`/api/categories/${id}`, input);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/categories/${id}`);
  },
};

export const ticketTypesService = {
  getAll: async (): Promise<TicketType[]> => {
    const { data } = await apiClient.get('/api/ticket-types');
    return data.data ?? data;
  },

  create: async (input: { name: string }): Promise<TicketType> => {
    const { data } = await apiClient.post('/api/ticket-types', input);
    return data.data ?? data;
  },

  update: async (id: string, input: { name: string }): Promise<TicketType> => {
    const { data } = await apiClient.patch(`/api/ticket-types/${id}`, input);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/ticket-types/${id}`);
  },
};
