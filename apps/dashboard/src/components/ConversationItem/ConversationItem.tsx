import { Badge } from '@knowbase/ui/components/badge';
import { Card, CardContent } from '@knowbase/ui/components/card';

export function ConversationItem({ id, title, status, confidence, time }: any) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 mb-4">
      <CardContent className="">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{id}</span>
          <Badge variant={status === 'Completed' ? 'success' : 'destructive'}>
            {status}
          </Badge>
        </div>

        <p className="text-sm">{title}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{confidence}%</span>
          <span>{time}</span>
        </div>
      </CardContent>
    </Card>
  );
}
