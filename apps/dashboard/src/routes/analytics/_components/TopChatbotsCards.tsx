import { Card, CardContent } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsTopChatbots } from '@/services';

type Props = {
  startDate: string;
  endDate: string;
};

export function TopChatbotsCards({ startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-top-chatbots', startDate, endDate],
    queryFn: async () => {
      const res = await getAnalyticsTopChatbots({
        query: { startDate, endDate } as never,
      });
      return res.data;
    },
  });

  return (
    <Card>
      <div className="px-6 pb-2">
        <h3 className="text-base font-semibold">Top Chatbots</h3>
      </div>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </>
        ) : isError ? (
          <div className="flex h-48 items-center justify-center text-sm text-destructive">
            Failed to load chatbot rankings
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No chatbot activity in this period
          </div>
        ) : (
          data.data.map((bot, i) => {
            const confidence = bot.avgConfidence
              ? `${(parseFloat(bot.avgConfidence) * 100).toFixed(1)}%`
              : '—';
            return (
              <div
                key={bot.chatbotId}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {bot.chatbotName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{bot.conversations.toLocaleString()} convs</span>
                    <span>·</span>
                    <span>{bot.messages.toLocaleString()} msgs</span>
                    <span>·</span>
                    <span>{confidence} confidence</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
