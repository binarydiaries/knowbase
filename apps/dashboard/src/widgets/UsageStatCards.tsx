import { Skeleton } from '@knowbase/ui/components/skeleton';
import { BookOpen, Bot, MessageCircle } from 'lucide-react';
import { UsageStatCard } from '@/components/UsageStatCard/UsageStatCard.tsx';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus.ts';

function UsageStatCardSkeleton() {
  return <Skeleton className="h-[72px] w-full rounded-xl" />;
}

export function UsageStatCards() {
  const { data: subscription, isLoading, isError } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UsageStatCardSkeleton />
        <UsageStatCardSkeleton />
        <UsageStatCardSkeleton />
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['Messages', 'Agents', 'Knowledge Sources'].map((title) => (
          <div
            key={title}
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            Failed to load {title.toLowerCase()} usage
          </div>
        ))}
      </div>
    );
  }

  const messagesUsed = subscription.messagesThisMonth;
  const messagesRemaining = Math.max(
    0,
    subscription.messagesPerMonthLimit - messagesUsed,
  );

  const agentsUsed = subscription.activeAgentCount;
  const agentsRemaining = Math.max(
    0,
    subscription.activeAgentLimit - agentsUsed,
  );

  const knowledgeUsed = subscription.knowledgeSourceCount;
  const knowledgeRemaining = Math.max(
    0,
    subscription.knowledgeSourceLimit - knowledgeUsed,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <UsageStatCard
        title="Messages"
        used={messagesUsed}
        remaining={messagesRemaining}
        icon={MessageCircle}
      />
      <UsageStatCard
        title="Agents"
        used={agentsUsed}
        remaining={agentsRemaining}
        icon={Bot}
      />
      <UsageStatCard
        title="Knowledge Sources"
        used={knowledgeUsed}
        remaining={knowledgeRemaining}
        icon={BookOpen}
      />
    </div>
  );
}
