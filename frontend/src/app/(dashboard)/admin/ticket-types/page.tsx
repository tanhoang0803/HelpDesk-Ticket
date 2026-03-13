'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketTypesService } from '@/services/departments.service';
import { TicketType } from '@/types/ticket.types';

export default function AdminTicketTypesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | TicketType | null>(null);
  const [name, setName]   = useState('');
  const [err, setErr]     = useState('');

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['ticket-types'],
    queryFn:  () => ticketTypesService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: () => ticketTypesService.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket-types'] }); closeModal(); },
    onError: (e: any) => setErr(e?.response?.data?.error?.message ?? 'Error'),
  });

  const updateMut = useMutation({
    mutationFn: () => ticketTypesService.update((modal as TicketType).id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket-types'] }); closeModal(); },
    onError: (e: any) => setErr(e?.response?.data?.error?.message ?? 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => ticketTypesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket-types'] }),
  });

  const openCreate = () => { setName(''); setErr(''); setModal('create'); };
  const openEdit   = (t: TicketType) => { setName(t.name); setErr(''); setModal(t); };
  const closeModal = () => setModal(null);
  const isEditing  = modal && modal !== 'create';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Types</h1>
          <p className="text-sm text-gray-500 mt-1">{types.length} total</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          + New Type
        </button>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-3">Edit</button>
                  <button onClick={() => { if (confirm('Delete this ticket type?')) deleteMut.mutate(t.id); }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{isEditing ? 'Edit Ticket Type' : 'New Ticket Type'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); isEditing ? updateMut.mutate() : createMut.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                  {createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
