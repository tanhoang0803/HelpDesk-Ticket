'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { StatusCount } from '@/types/analytics.types';

interface Props { data: StatusCount[] | undefined; isLoading: boolean }

const STATUS_COLORS: Record<string, string> = {
  OPEN:        '#3b82f6',
  ASSIGNED:    '#8b5cf6',
  IN_PROGRESS: '#f59e0b',
  PENDING:     '#f97316',
  RESOLVED:    '#10b981',
  VERIFIED:    '#059669',
  CLOSED:      '#6b7280',
  CANCELLED:   '#ef4444',
  ESCALATED:   '#dc2626',
  REOPENED:    '#0ea5e9',
};

export function StatusDistributionChart({ data, isLoading }: Props) {
  const filtered = data?.filter((d) => d.count > 0) ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Distribution</h3>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
      ) : filtered.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={44}
              paddingAngle={2}
            >
              {filtered.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => value.replace(/_/g, ' ')}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
