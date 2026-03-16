'use client';

import { OverviewData } from '@/types/analytics.types';

interface Props { data: OverviewData | undefined; isLoading: boolean }

interface CardDef {
  label: string;
  value: (d: OverviewData) => string | number;
  sub: string;
  color: string;
}

const CARDS: CardDef[] = [
  {
    label: 'Open Tickets',
    value: (d) => d.openTickets,
    sub: 'Currently active',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    label: 'Created Today',
    value: (d) => d.createdToday,
    sub: `${0} this week`,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    label: 'Created This Month',
    value: (d) => d.createdThisMonth,
    sub: `${0} this week`,
    color: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    label: 'Resolution Rate',
    value: (d) => `${d.resolutionRatePercent}%`,
    sub: 'In selected range',
    color: 'bg-green-50 text-green-700 border-green-100',
  },
  {
    label: 'Avg Resolution',
    value: (d) => `${d.avgResolutionHours.toFixed(1)}h`,
    sub: 'In selected range',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
  },
];

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((_, i) => (
        <div key={i} className="rounded-xl border p-5 animate-pulse bg-gray-100 h-24" />
      ))}
    </div>
  );
}

export function OverviewCards({ data, isLoading }: Props) {
  if (isLoading || !data) return <Skeleton />;

  const values: CardDef[] = [
    { ...CARDS[0], sub: 'Currently active' },
    { ...CARDS[1], sub: `${data.createdThisWeek} this week` },
    { ...CARDS[2], sub: `${data.createdThisWeek} this week` },
    CARDS[3],
    CARDS[4],
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {values.map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
          <p className="text-3xl font-bold mt-1">{card.value(data)}</p>
          <p className="text-xs mt-1 opacity-60">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
