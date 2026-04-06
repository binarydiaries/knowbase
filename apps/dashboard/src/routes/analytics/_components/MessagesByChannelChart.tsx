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
import { getAnalyticsMessagesByChannel } from '@/services';
import { CHART_COLORS } from '../../usage/_utils/dateRange';

function capitalizeChannel(type: string): string {
  const map: Record<string, string> = {
    web: 'Web',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  };
  return map[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

type Props = {
  chatbotId: string;
  startDate: string;
  endDate: string;
};

export function MessagesByChannelChart({ chatbotId, startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-msgs-channel', chatbotId, startDate, endDate],
    queryFn: async () => {
      const res = await getAnalyticsMessagesByChannel({
        query: {
          startDate,
          endDate,
          ...(chatbotId !== 'all' && { chatbotId }),
        } as never,
      });
      return res.data;
    },
  });

  const chartConfig: ChartConfig = {};
  data?.data.forEach((item, i) => {
    chartConfig[item.channelType] = {
      label: capitalizeChannel(item.channelType),
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Messages by Channel</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load channel data
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No channel data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <PieChart>
              <Pie
                data={data.data}
                dataKey="count"
                nameKey="channelType"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
              >
                {data.data.map((entry, i) => (
                  <Cell
                    key={entry.channelType}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent nameKey="channelType" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
