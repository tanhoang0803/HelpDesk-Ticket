'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, departmentsService } from '@/services/departments.service';
import { Category } from '@/types/ticket.types';

interface CatForm { name: string; departmentId: string }
const empty: CatForm = { name: '', departmentId: '' };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Category | null>(null);
  const [form, setForm]   = useState<CatForm>(empty);
  const [err, setErr]     = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-all'],
    queryFn:  () => categoriesService.getAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => departmentsService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: () => categoriesService.create({ name: form.name, departmentId: form.departmentId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-all'] }); closeModal(); },
    onError: (e: Error) => setErr(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => categoriesService.update((modal as Category).id, { name: form.name, departmentId: form.departmentId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories-all'] }); closeModal(); },
    onError: (e: Error) => setErr(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-all'] }),
  });

  const openCreate = () => { setForm(empty); setErr(''); setModal('create'); };
  const openEdit   = (c: Category) => { setForm({ name: c.name, departmentId: c.departmentId ?? '' }); setErr(''); setModal(c); };
  const closeModal = () => setModal(null);
  const isEditing  = modal && modal !== 'create';

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} total</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          + New Category
        </button>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.departmentId ? deptMap[c.departmentId] ?? '—' : 'Global'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-3">Edit</button>
                  <button onClick={() => { if (confirm('Delete this category?')) deleteMut.mutate(c.id); }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{isEditing ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (isEditing) { updateMut.mutate(); } else { createMut.mutate(); } }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Global (no department)</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
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
