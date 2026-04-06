import { Card, CardContent } from '@knowbase/ui/components/card';
import type { LucideIcon } from 'lucide-react';

type UsageStatCardProps = {
  title: string;
  used: number;
  remaining: number;
  icon: LucideIcon;
};

export function UsageStatCard({
  title,
  used,
  remaining,
  icon: Icon,
}: UsageStatCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold">{used.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">used</span>
          <span className="text-muted-foreground/30 mx-1">·</span>
          <span className="text-xl font-semibold">
            {remaining.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}
