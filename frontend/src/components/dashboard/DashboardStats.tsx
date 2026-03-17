'use client';

import { useTickets } from '@/hooks/useTickets';

interface CardDef {
  label:  string;
  status: string;
  color:  string;
  icon:   string;
}

const CARDS: CardDef[] = [
  { label: 'Open Tickets',   status: 'OPEN',        color: 'bg-blue-50   text-blue-700',   icon: '🔵' },
  { label: 'In Progress',    status: 'IN_PROGRESS',  color: 'bg-indigo-50 text-indigo-700', icon: '⚙️' },
  { label: 'Pending Review', status: 'PENDING',      color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
  { label: 'Resolved',       status: 'RESOLVED',     color: 'bg-green-50  text-green-700',  icon: '✅' },
];

// One lightweight query per status — limit:1 so we only need meta.total
function useStatusCount(status: string) {
  const { data, isLoading } = useTickets({ status: status as any, limit: 1, page: 1 });
  return { count: data?.meta.total ?? 0, isLoading };
}

export function DashboardStats() {
  const open       = useStatusCount('OPEN');
  const inProgress = useStatusCount('IN_PROGRESS');
  const pending    = useStatusCount('PENDING');
  const resolved   = useStatusCount('RESOLVED');

  const counts = [open.count, inProgress.count, pending.count, resolved.count];
  const loading = open.isLoading || inProgress.isLoading || pending.isLoading || resolved.isLoading;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {CARDS.map((card, i) => (
        <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="text-2xl font-bold">
            {loading
              ? <span className="inline-block w-8 h-7 bg-current opacity-10 rounded animate-pulse" />
              : counts[i]
            }
          </div>
          <div className="text-sm font-medium mt-1 opacity-80">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
