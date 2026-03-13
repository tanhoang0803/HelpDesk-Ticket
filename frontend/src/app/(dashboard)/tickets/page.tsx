'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTickets } from '@/hooks/useTickets';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketStatus, Priority } from '@/types/ticket.types';

const STATUSES: TicketStatus[] = ['OPEN','ASSIGNED','IN_PROGRESS','PENDING','RESOLVED','VERIFIED','ESCALATED','CLOSED','CANCELLED'];
const PRIORITIES: Priority[]   = ['CRITICAL','HIGH','MEDIUM','LOW'];

export default function TicketsPage() {
  const [status,   setStatus]   = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);

  const { data, isLoading, error } = useTickets({
    page, limit: 20,
    status:   status   || undefined,
    priority: priority || undefined,
    search:   search   || undefined,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.meta.total ?? '…'} total tickets</p>
        </div>
        <Link href="/tickets/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as TicketStatus | ''); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as Priority | ''); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          Failed to load tickets. {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-3">
            {data.data.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">🎫</p>
                <p>No tickets found</p>
              </div>
            ) : (
              data.data.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
            )}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
