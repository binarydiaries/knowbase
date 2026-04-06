import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { Card, CardContent } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { getChatbots } from '@/services';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { AnalyticsOverviewCards } from './_components/AnalyticsOverviewCards';
import { ConversationsDailyChart } from './_components/ConversationsDailyChart';
import { CountryDistributionChart } from './_components/CountryDistributionChart';
import { MessagesByChannelChart } from './_components/MessagesByChannelChart';
import { SentimentChart } from './_components/SentimentChart';
import { TopChatbotsCards } from './_components/TopChatbotsCards';
import { TopTopicsChart } from './_components/TopTopicsChart';
import { type DateRange, getDateRange } from '../usage/_utils/dateRange';

export const Route = createFileRoute('/analytics/')({
  component: RouteComponent,
});

function AnalyticsUpgradePrompt() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Analytics is available on Starter and above</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            See conversations over time, sentiment breakdown, top topics, country reach, and more.
          </p>
        </div>
        <a
          href="/settings/billing"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Upgrade to Starter — $4.9/mo
        </a>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const [chatbotId, setChatbotId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const { startDate, endDate } = getDateRange(dateRange);

  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getChatbots(),
  });
  const chatbots = chatbotsData?.data?.chatbots ?? [];

  const { data: subscription, isLoading: subLoading } = useSubscriptionStatus();
  const isPaidPlan = subscription?.plan !== 'free';

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium">Analytics</h1>
          {isPaidPlan && (
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
          )}
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {/* All-time overview — visible on all plans as a teaser */}
        <AnalyticsOverviewCards />

        {/* Charts — gated behind paid plan */}
        {subLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : !isPaidPlan ? (
          <AnalyticsUpgradePrompt />
        ) : (
          <>
            {/* Conversations over time */}
            <ConversationsDailyChart
              chatbotId={chatbotId}
              startDate={startDate}
              endDate={endDate}
            />

            {/* Channel breakdown + Top chatbots */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MessagesByChannelChart
                chatbotId={chatbotId}
                startDate={startDate}
                endDate={endDate}
              />
              <TopChatbotsCards startDate={startDate} endDate={endDate} />
            </div>

            {/* Sentiment + Top topics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SentimentChart
                chatbotId={chatbotId}
                startDate={startDate}
                endDate={endDate}
              />
              <TopTopicsChart
                chatbotId={chatbotId}
                startDate={startDate}
                endDate={endDate}
              />
            </div>

            {/* Country distribution */}
            <CountryDistributionChart
              chatbotId={chatbotId}
              startDate={startDate}
              endDate={endDate}
            />
          </>
        )}
      </div>
    </>
  );
}
