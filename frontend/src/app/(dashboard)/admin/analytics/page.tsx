'use client';

import { useState } from 'react';
import { AnalyticsQuery } from '@/types/analytics.types';
import { AnalyticsFilters }          from '@/components/analytics/AnalyticsFilters';
import { OverviewCards }             from '@/components/analytics/OverviewCards';
import { TicketVolumeChart }         from '@/components/analytics/TicketVolumeChart';
import { StatusDistributionChart }   from '@/components/analytics/StatusDistributionChart';
import { PriorityDistributionChart } from '@/components/analytics/PriorityDistributionChart';
import { ResolutionTimeChart }       from '@/components/analytics/ResolutionTimeChart';
import { DepartmentBreakdownChart }  from '@/components/analytics/DepartmentBreakdownChart';
import { AgentLoadTable }            from '@/components/analytics/AgentLoadTable';
import {
  useOverview,
  useTicketVolume,
  usePriorityDistribution,
  useDepartmentBreakdown,
  useResolutionTimeTrend,
  useAgentLoad,
} from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const [query, setQuery] = useState<AnalyticsQuery>({});

  const overview    = useOverview(query);
  const volume      = useTicketVolume(query);
  const priority    = usePriorityDistribution(query);
  const department  = useDepartmentBreakdown(query);
  const resolution  = useResolutionTimeTrend(query);
  const agentLoad   = useAgentLoad(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Ticket volume, resolution time, and agent performance</p>
      </div>

      <AnalyticsFilters onChange={setQuery} />

      <OverviewCards data={overview.data} isLoading={overview.isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketVolumeChart       data={volume.data}      isLoading={volume.isLoading}     />
        <StatusDistributionChart data={overview.data?.statusDistribution} isLoading={overview.isLoading} />
        <ResolutionTimeChart     data={resolution.data}  isLoading={resolution.isLoading} />
        <PriorityDistributionChart data={priority.data}  isLoading={priority.isLoading}   />
      </div>

      <DepartmentBreakdownChart data={department.data} isLoading={department.isLoading} />

      <AgentLoadTable data={agentLoad.data} isLoading={agentLoad.isLoading} />
    </div>
  );
}
