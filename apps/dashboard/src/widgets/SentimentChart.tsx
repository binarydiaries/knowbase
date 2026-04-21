import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@knowbase/ui/components/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart } from 'recharts';
import { getAnalyticsSentiment } from '@/services';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
};

const chartConfig = {
  positive: { label: 'Positive', color: '#22c55e' },
  neutral: { label: 'Neutral', color: '#94a3b8' },
  negative: { label: 'Negative', color: '#ef4444' },
} satisfies ChartConfig;

type Props = {
  agentId: string;
  startDate: string;
  endDate: string;
};

export function SentimentChart({ agentId, startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-sentiment', agentId, startDate, endDate],
    queryFn: async () => {
      const res = await getAnalyticsSentiment({
        query: {
          startDate,
          endDate,
          ...(agentId !== 'all' && { agentId }),
        } as never,
      });
      return res.data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load sentiment data
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No sentiment data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <PieChart>
              <Pie
                data={data.data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
              >
                {data.data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={SENTIMENT_COLORS[entry.label] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent nameKey="label" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
