'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema, CreateTicketFormValues } from '@/lib/validators/ticket.schema';
import { useCreateTicket } from '@/hooks/useTickets';
import { useDepartments, useCategories, useTicketTypes } from '@/hooks/useDepartments';

export default function NewTicketPage() {
  const router  = useRouter();
  const [selectedDept, setSelectedDept] = useState('');
  const createTicket   = useCreateTicket();
  const { data: departments } = useDepartments();
  const { data: categories  } = useCategories(selectedDept || undefined);
  const { data: ticketTypes } = useTicketTypes();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const deptId = watch('departmentId');
  if (deptId !== selectedDept) setSelectedDept(deptId);

  const onSubmit = async (data: CreateTicketFormValues) => {
    const ticket = await createTicket.mutateAsync({
      ...data,
      assignedToId: data.assignedToId || undefined,
    });
    router.push(`/tickets/${ticket.id}`);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new support request</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief summary of the issue"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{String(errors.title.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe the issue in detail…"
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{String(errors.description.message)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select {...register('departmentId')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select department</option>
                {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.departmentId && <p className="text-xs text-red-600 mt-1">{String(errors.departmentId.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('categoryId')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-red-600 mt-1">{String(errors.categoryId.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type *</label>
              <select {...register('ticketTypeId')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select type</option>
                {ticketTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.ticketTypeId && <p className="text-xs text-red-600 mt-1">{String(errors.ticketTypeId.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {createTicket.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {(createTicket.error as Error)?.message ?? 'Failed to create ticket'}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || createTicket.isPending}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {createTicket.isPending ? 'Creating…' : 'Create Ticket'}
            </button>
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
