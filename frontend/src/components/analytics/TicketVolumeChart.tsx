'use client';

import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { VolumeBucket } from '@/types/analytics.types';

interface Props { data: VolumeBucket[] | undefined; isLoading: boolean }

function formatBucket(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChartSkeleton() {
  return <div className="h-64 animate-pulse rounded-lg bg-gray-100" />;
}

export function TicketVolumeChart({ data, isLoading }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Ticket Volume</h3>
      {isLoading || !data ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data for selected range</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.map((b) => ({ ...b, bucket: formatBucket(b.bucket) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              cursor={{ fill: '#f5f3ff' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
