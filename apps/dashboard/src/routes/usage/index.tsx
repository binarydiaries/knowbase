import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { getAgents } from '@/services';
import { type DateRange, getDateRange } from '../../utils/dateRange.ts';
import { DailyMessagesChart } from '../../widgets/DailyMessagesChart.tsx';
import { KnowledgeByAgentChart } from '../../widgets/KnowledgeByAgentChart.tsx';
import { MessagesByAgentChart } from '../../widgets/MessagesByAgentChart.tsx';
import { UsageStatCards } from '../../widgets/UsageStatCards.tsx';

export const Route = createFileRoute('/usage/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [agentId, setAgentId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { startDate, endDate } = getDateRange(dateRange);

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => getAgents(),
  });
  const agents = agentsData?.data?.agents ?? [];

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium">Usage</h1>
          <div className="flex items-center gap-2 ml-auto">
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={dateRange}
              onValueChange={(v) => setDateRange(v as DateRange)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        <UsageStatCards />
        <DailyMessagesChart
          agentId={agentId}
          startDate={startDate}
          endDate={endDate}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MessagesByAgentChart
            agentId={agentId}
            startDate={startDate}
            endDate={endDate}
          />
          <KnowledgeByAgentChart agentId={agentId} />
        </div>
      </div>
    </>
  );
}
