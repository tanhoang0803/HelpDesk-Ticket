'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTickets } from '@/hooks/useTickets';
import { Ticket, TicketStatus, Priority } from '@/types/ticket.types';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils/ticket-status';

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey   = 'status' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN:        'Open',
  ASSIGNED:    'Assigned',
  IN_PROGRESS: 'In Progress',
  PENDING:     'Pending',
  RESOLVED:    'Resolved',
  VERIFIED:    'Verified',
  REOPENED:    'Reopened',
  ESCALATED:   'Escalated',
  CANCELLED:   'Cancelled',
  CLOSED:      'Closed',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH:     'High',
  MEDIUM:   'Medium',
  LOW:      'Low',
};

const ALL_STATUSES: TicketStatus[] = [
  'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING',
  'RESOLVED', 'VERIFIED', 'REOPENED', 'ESCALATED', 'CANCELLED', 'CLOSED',
];

const ALL_PRIORITIES: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTableDate(iso: string): string {
  const d = new Date(iso);
  const HH   = String(d.getHours()).padStart(2, '0');
  const mm   = String(d.getMinutes()).padStart(2, '0');
  const ss   = String(d.getSeconds()).padStart(2, '0');
  const DD   = String(d.getDate()).padStart(2, '0');
  const MM   = String(d.getMonth() + 1).padStart(2, '0');
  const YYYY = d.getFullYear();
  return `${HH}:${mm}:${ss} ${DD}/${MM}/${YYYY}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Sort indicator ────────────────────────────────────────────────────────────

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <span className="ml-1 text-gray-300 select-none">↕</span>;
  return <span className="ml-1 text-indigo-600 select-none">{order === 'asc' ? '↑' : '↓'}</span>;
}

// ── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className="border-t border-gray-100">
          {Array.from({ length: 9 }).map((__, j) => (
            <td key={j} className="px-3 py-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 1 ? '80%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardTicketsTable() {
  const [searchInput,  setSearchInput]  = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [prioFilter,   setPrioFilter]   = useState<Priority | ''>('');
  const [page,         setPage]         = useState(1);
  const [sortKey,      setSortKey]      = useState<SortKey>('createdAt');
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('desc');

  const search = useDebounce(searchInput, 300);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter, prioFilter]);

  const { data, isLoading } = useTickets({
    page,
    limit:    PAGE_SIZE,
    search:   search   || undefined,
    status:   statusFilter || undefined,
    priority: prioFilter   || undefined,
  });

  // Client-side sort on the returned page
  const rows: Ticket[] = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === 'status') {
        av = a.status;
        bv = b.status;
      } else if (sortKey === 'updatedAt') {
        av = a.updatedAt;
        bv = b.updatedAt;
      } else {
        av = a.createdAt;
        bv = b.createdAt;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return key;
    });
  }, []);

  const totalPages = data?.meta.totalPages ?? 1;
  const total      = data?.meta.total      ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 mt-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">All Tickets</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} ticket{total !== 1 ? 's' : ''} total</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={prioFilter}
            onChange={(e) => setPrioFilter(e.target.value as Priority | '')}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">All Priorities</option>
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search tickets…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '110px' }} />  {/* Agent/Dept */}
            <col style={{ width: '240px' }} />  {/* Description */}
            <col style={{ width: '120px' }} />  {/* Assigned To */}
            <col style={{ width: '110px' }} />  {/* Category */}
            <col style={{ width: '110px' }} />  {/* Ticket Type */}
            <col style={{ width: '90px' }}  />  {/* Priority */}
            <col style={{ width: '100px' }} />  {/* Status */}
            <col style={{ width: '145px' }} />  {/* Created */}
            <col style={{ width: '145px' }} />  {/* Modified */}
          </colgroup>

          <thead>
            <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-3 text-left">Agent</th>
              <th className="px-3 py-3 text-left">Description</th>
              <th className="px-3 py-3 text-left">Assigned To</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-left">Type</th>
              <th className="px-3 py-3 text-left">Priority</th>
              <th
                className="px-3 py-3 text-left cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                onClick={() => toggleSort('status')}
              >
                Status
                <SortIcon active={sortKey === 'status'} order={sortOrder} />
              </th>
              <th
                className="px-3 py-3 text-left cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                onClick={() => toggleSort('createdAt')}
              >
                Created
                <SortIcon active={sortKey === 'createdAt'} order={sortOrder} />
              </th>
              <th
                className="px-3 py-3 text-left cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                onClick={() => toggleSort('updatedAt')}
              >
                Modified
                <SortIcon active={sortKey === 'updatedAt'} order={sortOrder} />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-gray-400 text-sm">
                  <span className="text-3xl block mb-2">🎫</span>
                  No tickets found
                </td>
              </tr>
            ) : (
              rows.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Agent / Department */}
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium text-gray-700 truncate block" title={ticket.department.name}>
                      {ticket.department.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                  </td>

                  {/* Description */}
                  <td className="px-3 py-3">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="block group-hover:text-indigo-600 transition-colors"
                    >
                      <span className="text-xs font-medium text-gray-800 block truncate" title={ticket.title}>
                        {ticket.title}
                      </span>
                      {(ticket as any).description && (
                        <span
                          className="text-xs text-gray-400 block truncate"
                          title={(ticket as any).description}
                        >
                          {(ticket as any).description}
                        </span>
                      )}
                    </Link>
                  </td>

                  {/* Assigned To */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700 truncate block" title={ticket.assignedTo?.name ?? '—'}>
                      {ticket.assignedTo?.name ?? (
                        <span className="text-gray-300 italic">Unassigned</span>
                      )}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 truncate block" title={ticket.category.name}>
                      {ticket.category.name}
                    </span>
                  </td>

                  {/* Ticket Type */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 truncate block" title={ticket.ticketType.name}>
                      {ticket.ticketType.name}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-500 whitespace-nowrap tabular-nums">
                      {formatTableDate(ticket.createdAt)}
                    </span>
                  </td>

                  {/* Modified */}
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-500 whitespace-nowrap tabular-nums">
                      {formatTableDate(ticket.updatedAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {/* Page number pills — show max 5 around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-2.5 py-1 border rounded text-xs transition-colors ${
                      page === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
