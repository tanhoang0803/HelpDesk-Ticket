'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsService } from '@/services/agents.service';
import { departmentsService } from '@/services/departments.service';
import { Agent } from '@/types/ticket.types';

const ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT', 'REQUESTER'];

interface AgentForm {
  name: string; email: string; password: string;
  departmentId: string; role: string;
}

const empty: AgentForm = { name: '', email: '', password: '', departmentId: '', role: 'AGENT' };

export default function AdminAgentsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Agent | null>(null);
  const [form, setForm]   = useState<AgentForm>(empty);
  const [err, setErr]     = useState('');

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn:  () => agentsService.getAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => departmentsService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: () => agentsService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); closeModal(); },
    onError: (e: Error) => setErr(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => agentsService.update((modal as Agent).id, {
      name: form.name, departmentId: form.departmentId, role: form.role,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); closeModal(); },
    onError: (e: Error) => setErr(e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => agentsService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });

  const openCreate = () => { setForm(empty); setErr(''); setModal('create'); };
  const openEdit   = (a: Agent) => {
    setForm({ name: a.name, email: a.email, password: '', departmentId: a.department.id, role: a.role });
    setErr('');
    setModal(a);
  };
  const closeModal = () => setModal(null);
  const isEditing  = modal && modal !== 'create';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) { updateMut.mutate(); } else { createMut.mutate(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-1">{agents.length} total</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          + New Agent
        </button>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.email}</td>
                <td className="px-4 py-3 text-gray-600">{a.department.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.role === 'ADMIN'      ? 'bg-red-100 text-red-700' :
                    a.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-700' :
                    a.role === 'AGENT'      ? 'bg-blue-100 text-blue-700' :
                                             'bg-gray-100 text-gray-700'
                  }`}>{a.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {a.isActive ? 'Active' : 'Inactive'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(a)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-3">Edit</button>
                  {a.isActive && (
                    <button onClick={() => deactivateMut.mutate(a.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {isEditing ? 'Edit Agent' : 'New Agent'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {!isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required minLength={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {err && <p className="text-xs text-red-600">{err}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                  {createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
