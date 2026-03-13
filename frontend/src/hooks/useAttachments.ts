import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsService } from '@/services/attachments.service';

export const useAttachments = (ticketId: string) =>
  useQuery({
    queryKey: ['attachments', ticketId],
    queryFn:  () => attachmentsService.getByTicket(ticketId),
    enabled:  !!ticketId,
  });

export const useUploadAttachment = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsService.upload(ticketId, file),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['attachments', ticketId] }),
  });
};

export const useDeleteAttachment = (ticketId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attachmentsService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['attachments', ticketId] }),
  });
};
