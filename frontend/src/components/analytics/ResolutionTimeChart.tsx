'use client';

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { ResolutionBucket } from '@/types/analytics.types';

interface Props { data: ResolutionBucket[] | undefined; isLoading: boolean }

function formatBucket(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ResolutionTimeChart({ data, isLoading }: Props) {
  const chartData = data?.map((b) => ({ ...b, bucket: formatBucket(b.bucket) })) ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Avg Resolution Time</h3>
      <p className="text-xs text-gray-400 mb-4">Hours from ticket creation to resolved</p>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No resolved tickets in range</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value) => [`${value}h`, 'Avg Resolution']}
            />
            <Area
              type="monotone"
              dataKey="avgHours"
              name="Avg Hours"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#resGrad)"
              dot={{ r: 3, fill: '#10b981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
