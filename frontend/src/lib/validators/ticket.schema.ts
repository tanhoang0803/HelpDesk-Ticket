import { z } from 'zod';

export const createTicketSchema = z.object({
  title:        z.string().min(5, 'Title must be at least 5 characters').max(200),
  description:  z.string().min(10, 'Description must be at least 10 characters').max(5000),
  departmentId: z.string().uuid('Select a department'),
  categoryId:   z.string().min(1, 'Select a category'),
  ticketTypeId: z.string().uuid('Select a ticket type'),
  priority:     z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const transitionSchema = z.object({
  status:  z.string().min(1),
  comment: z.string().max(2000).optional(),
});

export const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(2000),
});
