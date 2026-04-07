import { format, startOfMonth, subDays } from 'date-fns';

export type DateRange = '7d' | '30d' | '90d' | 'month';

export function getDateRange(range: DateRange): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  // endDate is tomorrow so today's messages are included
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const endDate = format(tomorrow, 'yyyy-MM-dd');

  if (range === '7d') {
    return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate };
  }
  if (range === '30d') {
    return { startDate: format(subDays(now, 30), 'yyyy-MM-dd'), endDate };
  }
  if (range === '90d') {
    return { startDate: format(subDays(now, 90), 'yyyy-MM-dd'), endDate };
  }
  return {
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    endDate,
  };
}

// Hex values — hsl(var(--chart-N)) doesn't resolve inside SVG fill attributes
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
];
