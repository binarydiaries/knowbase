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
import { getUsageKnowledgeByChatbot } from '@/services';
import { CHART_COLORS } from '../_utils/dateRange';

type Props = {
  chatbotId: string;
};

export function KnowledgeByChatbotChart({ chatbotId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage-knowledge-chatbot', chatbotId],
    queryFn: async () => {
      const res = await getUsageKnowledgeByChatbot({
        query: {
          ...(chatbotId !== 'all' && { chatbotId }),
        } as never,
      });
      return res.data;
    },
  });

  const chartConfig: ChartConfig = {};
  data?.data.forEach((item, i) => {
    chartConfig[item.chatbotId] = {
      label: item.chatbotName,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Knowledge Sources per Chatbot</CardTitle>
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
                nameKey="chatbotName"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
              >
                {data.data.map((entry, i) => (
                  <Cell
                    key={entry.chatbotId}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent nameKey="chatbotName" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
