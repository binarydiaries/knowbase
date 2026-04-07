import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  MessageCircle,
  MessagesSquare,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard/StatCard.tsx';
import { getAnalyticsOverview } from '@/services';

function SkeletonCard() {
  return <Skeleton className="h-[72px] w-full rounded-xl" />;
}

export function AnalyticsOverviewCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => getAnalyticsOverview(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Conversations', 'Messages', 'Avg Msgs/Conv', 'Avg Confidence'].map(
          (title) => (
            <div
              key={title}
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              Failed to load {title.toLowerCase()}
            </div>
          ),
        )}
      </div>
    );
  }

  const overview = data.data;
  const confidenceDisplay = overview.avgConfidenceScore
    ? `${(parseFloat(overview.avgConfidenceScore) * 100).toFixed(1)}%`
    : '—';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Conversations"
        value={overview.totalConversations.toLocaleString()}
        icon={MessagesSquare}
      />
      <StatCard
        title="Total Messages"
        value={overview.totalMessages.toLocaleString()}
        icon={MessageCircle}
      />
      <StatCard
        title="Avg Messages / Conv"
        value={overview.avgMessagesPerConv.toLocaleString()}
        icon={BarChart2}
      />
      <StatCard
        title="Avg Confidence"
        value={confidenceDisplay}
        icon={TrendingUp}
      />
    </div>
  );
}
