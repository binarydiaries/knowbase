import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@knowbase/ui/components/chart';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart } from 'recharts';
import { getUsageMessagesByAgent } from '@/services';
import { CHART_COLORS } from '../utils/dateRange.ts';

type Props = {
  agentId: string;
  startDate: string;
  endDate: string;
};

export function MessagesByAgentChart({
  agentId,
  startDate,
  endDate,
}: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage-msgs-agent', agentId, startDate, endDate],
    queryFn: async () => {
      const res = await getUsageMessagesByAgent({
        query: {
          startDate,
          endDate,
          ...(agentId !== 'all' && { agentId }),
        } as never,
      });
      return res.data;
    },
  });

  const chartConfig: ChartConfig = {};
  data?.data.forEach((item, i) => {
    chartConfig[item.agentId] = {
      label: item.agentName,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Messages per Agent</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load messages by agent
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No message data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <PieChart>
              <Pie
                data={data.data}
                dataKey="count"
                nameKey="agentName"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
              >
                {data.data.map((entry, i) => (
                  <Cell
                    key={entry.agentId}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent nameKey="agentName" />}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
