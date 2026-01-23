import { Card, CardContent } from '@knowbase/ui/components/card';

export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'bg-muted',
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 px-6">
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
