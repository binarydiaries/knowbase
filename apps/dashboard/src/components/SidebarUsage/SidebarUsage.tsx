import { Progress } from '@knowbase/ui/components/progress';
import {
  SidebarGroup,
  SidebarGroupContent,
} from '@knowbase/ui/components/sidebar';
import { Gauge } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus.ts';

export function SidebarUsage() {
  const subscriptionQuery = useSubscriptionStatus();
  const subscription = subscriptionQuery.data;

  if (!subscription) {
    return null;
  }

  const safeLimit = Math.max(subscription.messagesPerMonthLimit, 1);
  const percentage = Math.min(
    (subscription.messagesThisMonth / safeLimit) * 100,
    100,
  );

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupContent>
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-sidebar-primary/10 p-2 text-sidebar-primary">
              <Gauge className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium capitalize">
                {subscription.plan}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                Monthly assistant messages
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-sidebar-foreground/70">This month</span>
              <span className="font-medium">
                {subscription.messagesThisMonth} /{' '}
                {subscription.messagesPerMonthLimit}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
