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
import { getUsageKnowledgeByAgent } from '@/services';
import { CHART_COLORS } from '../utils/dateRange.ts';

type Props = {
  agentId: string;
};

export function KnowledgeByAgentChart({ agentId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage-knowledge-agent', agentId],
    queryFn: async () => {
      const res = await getUsageKnowledgeByAgent({
        query: {
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
        <CardTitle className="text-base">Knowledge Sources per Agent</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load knowledge source data
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No knowledge sources found
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
