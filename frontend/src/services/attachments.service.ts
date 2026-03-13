import apiClient from '@/lib/api-client';
import { Attachment } from '@/types/ticket.types';

export const attachmentsService = {
  getByTicket: async (ticketId: string): Promise<Attachment[]> => {
    const { data } = await apiClient.get(`/api/tickets/${ticketId}/attachments`);
    return data.data ?? data;
  },

  upload: async (ticketId: string, file: File): Promise<Attachment> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(`/api/tickets/${ticketId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/attachments/${id}`);
  },

  downloadUrl: (id: string): string =>
    `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${id}/download`,
};
