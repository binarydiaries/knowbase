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
import { useEffect, useState } from 'react';
import { getChatbots, postChatbots } from '@/services';
import { CreateChatbotDialog } from '@/widgets/CreateChatbotDialog/CreateChatbotDialog.tsx';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

type Chatbot = {
  id: string;
  name: string;
  conversations: number;
  lastTrained: string;
  status: 'live' | 'draft';
};

function RouteComponent() {
  const [chatbots, setChatbots] = useState([]);
  useEffect(() => {
    getAllChatbots();
  }, [chatbots]);

  const getAllChatbots = () => {
    getChatbots().then((value) => {
      setChatbots(
        value.data.chatbots.map(
          (bot: any): Chatbot => ({
            id: bot.id,
            name: bot.name,
            status: bot.status,
            conversations: bot.conversations ?? 0, // ✅ default
            lastTrained: bot.updatedAt
              ? new Date(bot.updatedAt).toLocaleDateString()
              : 'Never',
            createdAt: bot.createdAt ? new Date(bot.createdAt) : undefined,
            updatedAt: bot.updatedAt ? new Date(bot.updatedAt) : undefined,
          }),
        ),
      );
    });
  };

  async function handleCreateChatbot(name: string) {
    await postChatbots({
      body: { name },
    });

    getAllChatbots();
  }

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
          <CreateChatbotDialog onCreate={handleCreateChatbot} />
        </div>
      </header>
      <Separator />

      <div className="p-5">
        {/* Chatbot List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => (
            <Link
              to={`/chatbots/$chatbotId`}
              params={{ chatbotId: bot.id }}
              key={bot.id}
            >
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
