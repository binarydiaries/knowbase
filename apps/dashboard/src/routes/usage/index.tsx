import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { getChatbots } from '@/services';
import { DailyMessagesChart } from './_components/DailyMessagesChart';
import { KnowledgeByChatbotChart } from './_components/KnowledgeByChatbotChart';
import { MessagesByChatbotChart } from './_components/MessagesByChatbotChart';
import { UsageStatCards } from './_components/UsageStatCards';
import { type DateRange, getDateRange } from './_utils/dateRange';

export const Route = createFileRoute('/usage/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [chatbotId, setChatbotId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { startDate, endDate } = getDateRange(dateRange);

  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getChatbots(),
  });
  const chatbots = chatbotsData?.data?.chatbots ?? [];

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
            <Select value={chatbotId} onValueChange={setChatbotId}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Chatbots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chatbots</SelectItem>
                {chatbots.map((bot) => (
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
          chatbotId={chatbotId}
          startDate={startDate}
          endDate={endDate}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MessagesByChatbotChart
            chatbotId={chatbotId}
            startDate={startDate}
            endDate={endDate}
          />
          <KnowledgeByChatbotChart chatbotId={chatbotId} />
        </div>
      </div>
    </>
  );
}
