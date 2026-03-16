'use client';

import { useState, useEffect } from 'react';
import { AnalyticsQuery } from '@/types/analytics.types';
import { Department } from '@/types/ticket.types';
import { useDepartments } from '@/hooks/useDepartments';

interface Props { onChange: (q: AnalyticsQuery) => void }

type Preset = '7d' | '30d' | '90d' | 'month';

function toIso(d: Date) { return d.toISOString().split('T')[0]; }

function presetRange(preset: Preset): { startDate: string; endDate: string } {
  const end   = new Date();
  const start = new Date();
  if (preset === '7d')    start.setDate(end.getDate() - 7);
  if (preset === '30d')   start.setDate(end.getDate() - 30);
  if (preset === '90d')   start.setDate(end.getDate() - 90);
  if (preset === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { startDate: toIso(start), endDate: toIso(end) };
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d',    label: 'Last 7 days' },
  { key: '30d',   label: 'Last 30 days' },
  { key: '90d',   label: 'Last 90 days' },
  { key: 'month', label: 'This month' },
];

export function AnalyticsFilters({ onChange }: Props) {
  const [preset,       setPreset]       = useState<Preset>('30d');
  const [startDate,    setStartDate]    = useState(() => presetRange('30d').startDate);
  const [endDate,      setEndDate]      = useState(() => presetRange('30d').endDate);
  const [departmentId, setDepartmentId] = useState('');
  const [granularity,  setGranularity]  = useState<'day' | 'week' | 'month'>('day');

  const { data: depts } = useDepartments();

  useEffect(() => {
    onChange({
      startDate:    startDate || undefined,
      endDate:      endDate   || undefined,
      departmentId: departmentId || undefined,
      granularity,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, departmentId, granularity]);

  function applyPreset(key: Preset) {
    setPreset(key);
    const range = presetRange(key);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              preset === p.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Custom date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => { setStartDate(e.target.value); setPreset('' as Preset); }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => { setEndDate(e.target.value); setPreset('' as Preset); }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Department filter */}
      <select
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All departments</option>
        {(depts ?? []).map((d: Department) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      {/* Granularity */}
      <select
        value={granularity}
        onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="day">Daily</option>
        <option value="week">Weekly</option>
        <option value="month">Monthly</option>
      </select>
    </div>
  );
}
