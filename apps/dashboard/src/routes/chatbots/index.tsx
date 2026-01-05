import { Badge } from '@knowbase/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { createFileRoute, Link } from '@tanstack/react-router';
import { CreateChatbotDialog } from '@/widgets/CreateChatbotDialog/CreateChatbotDialog.tsx';

export const Route = createFileRoute('/chatbots/')({
  component: RouteComponent,
});

type Chatbot = {
  id: string;
  name: string;
  conversations: number;
  lastTrained: string;
  status: 'live' | 'draft';
};

const chatbots: Chatbot[] = [
  {
    id: '1',
    name: 'Website Support Bot',
    conversations: 1234,
    lastTrained: '2 days ago',
    status: 'live',
  },
  {
    id: '2',
    name: 'Pricing Assistant',
    conversations: 342,
    lastTrained: '5 days ago',
    status: 'draft',
  },
];

function RouteComponent() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium flex-1">Chatbots</h1>
          <CreateChatbotDialog />
        </div>
      </header>
      <Separator />

      <div className="p-5">
        {/* Chatbot List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => (
            <Link to={`/chatbots/${bot.id}`} key={bot.id}>
              <Card key={bot.id} className="hover:shadow-sm transition">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base font-medium">
                    {bot.name}
                  </CardTitle>
                  <Badge
                    variant={bot.status === 'live' ? 'default' : 'secondary'}
                  >
                    {bot.status === 'live' ? 'Live' : 'Draft'}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {bot.conversations.toLocaleString()} conversations
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Last trained: {bot.lastTrained}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
