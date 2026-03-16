'use client';

import { useState } from 'react';
import { AgentLoadRow } from '@/types/analytics.types';

interface Props { data: AgentLoadRow[] | undefined; isLoading: boolean }

type SortKey = 'agentName' | 'assigned' | 'resolved' | 'avgResolutionHours';

function Th({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey;
  current: SortKey; dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
    >
      {label}
      <span className="ml-1 text-gray-300">
        {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );
}

export function AgentLoadTable({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('assigned');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...(data ?? [])].sort((a, b) => {
    const av = a[sortKey] ?? -1;
    const bv = b[sortKey] ?? -1;
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Agent Load</h3>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No agent data available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th label="Agent"             sortKey="agentName"          current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                <Th label="Assigned (active)" sortKey="assigned"           current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Resolved (range)"  sortKey="resolved"           current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Avg Resolution"    sortKey="avgResolutionHours" current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row) => (
                <tr key={row.agentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.agentName}</td>
                  <td className="px-4 py-3 text-gray-500">{row.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.assigned > 10
                        ? 'bg-red-100 text-red-700'
                        : row.assigned > 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {row.assigned}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.resolved}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.avgResolutionHours != null ? `${row.avgResolutionHours}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
