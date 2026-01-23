import { Badge } from '@knowbase/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { ScrollArea } from '@knowbase/ui/components/scroll-area';
import { Separator } from '@knowbase/ui/components/separator';
import { Bot, Clock, FileText, MessageSquare, User } from 'lucide-react';
import { ConversationItem } from '@/components/ConversationItem/ConversationItem.tsx';
import { StatCard } from '@/components/StatCard/StatCard.tsx';

export default function ConversationsDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Conversations" value={3} icon={MessageSquare} />
        <StatCard
          title="Avg. Confidence"
          value="72%"
          icon={Bot}
          color="bg-green-100"
        />
        <StatCard
          title="Total Messages"
          value={12}
          icon={Clock}
          color="bg-blue-100"
        />
        <StatCard
          title="Sources Used"
          value={12}
          icon={FileText}
          color="bg-purple-100"
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <Input placeholder="Search conversations..." />
          </CardHeader>

          <ScrollArea className="h-[420px] px-4 pb-4 space-y-3">
            <ConversationItem
              id="sess_abc123"
              title="What are your business hours?"
              status="Completed"
              confidence={92}
              time="10:30 AM"
            />
            <ConversationItem
              id="sess_def456"
              title="How do I integrate your API?"
              status="Completed"
              confidence={78}
              time="11:15 AM"
            />
            <ConversationItem
              id="sess_ghi789"
              title="Custom enterprise solutions?"
              status="Abandoned"
              confidence={45}
              time="02:00 PM"
            />
          </ScrollArea>
        </Card>

        {/* Right panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Conversation Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                sess_abc123 · 2024-01-15 10:30 AM
              </p>
            </div>
            <Badge variant="success">Completed</Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User message */}
            <div className="flex gap-3">
              <User className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-sm">What are your business hours?</p>
              </div>
            </div>

            <Separator />

            {/* Assistant message */}
            <div className="flex gap-3">
              <Bot className="h-5 w-5 mt-1 text-green-500" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Assistant</p>
                <p className="text-sm">
                  Our business hours are Monday to Friday, 9 AM to 6 PM EST.
                  We're closed on weekends and major holidays.
                </p>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <Badge variant="success">95%</Badge>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">Business Info · 98%</Badge>
                  <Badge variant="secondary">Hours FAQ · 85%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
