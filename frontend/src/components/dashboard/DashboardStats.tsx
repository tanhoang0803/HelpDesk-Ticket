'use client';

import { useOverview } from '@/hooks/useAnalytics';

interface CardDef {
  label: string;
  status: string;
  color: string;
  icon: string;
}

const CARDS: CardDef[] = [
  { label: 'Open Tickets',   status: 'OPEN',        color: 'bg-blue-50   text-blue-700',   icon: '🔵' },
  { label: 'In Progress',    status: 'IN_PROGRESS',  color: 'bg-indigo-50 text-indigo-700', icon: '⚙️' },
  { label: 'Pending Review', status: 'PENDING',      color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
  { label: 'Resolved',       status: 'RESOLVED',     color: 'bg-green-50  text-green-700',  icon: '✅' },
];

export function DashboardStats() {
  const { data, isLoading } = useOverview({});

  const statusMap = Object.fromEntries(
    (data?.statusDistribution ?? []).map((s) => [s.status, s.count]),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {CARDS.map((card) => (
        <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <span className="inline-block w-8 h-7 bg-current opacity-10 rounded animate-pulse" />
            ) : (
              statusMap[card.status] ?? 0
            )}
          </div>
          <div className="text-sm font-medium mt-1 opacity-80">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
