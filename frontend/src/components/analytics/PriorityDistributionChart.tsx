'use client';

import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { PriorityCount } from '@/types/analytics.types';

interface Props { data: PriorityCount[] | undefined; isLoading: boolean }

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#10b981',
};

const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function PriorityDistributionChart({ data, isLoading }: Props) {
  const sorted = data
    ? [...data].sort((a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority))
    : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Priority Breakdown</h3>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
      ) : sorted.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="priority"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number, _: string, props: { payload: PriorityCount }) =>
                [`${value} (${props.payload.percent}%)`, 'Tickets']
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {sorted.map((entry) => (
                <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
