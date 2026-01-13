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
import { Bot, Ellipsis } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getChatbots, postChatbots } from '@/services';
import { timeAgo } from '@/services/utilities/datetimeHelper.ts';
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
            description: bot.description,
            status: bot.status,
            conversations: bot.conversations ?? 0, // ✅ default
            lastTrained: bot.updatedAt ? timeAgo(bot.updatedAt) : 'Never',
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
              key={bot.id}
              to={`/chatbots/$chatbotId`}
              params={{ chatbotId: bot.id }}
              className="block"
            >
              <Card className="rounded-xl border bg-background shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Bot className="h-5 w-5" />
                    </div>

                    {/* Title + status */}
                    <div className={'flex-1'}>
                      <div className="flex flex-col  gap-2">
                        <h3 className="text-base font-semibold leading-none">
                          {bot.name}
                        </h3>

                        <Badge
                          className={
                            bot.status === 'live'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {bot.status === 'live' ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                    </div>

                    {/* Menu */}
                    <div className="text-muted-foreground">
                      <Ellipsis className="h-5 w-5" />
                    </div>
                  </div>
                  {/* Description (optional / placeholder) */}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bot.description}
                  </p>

                  {/* Bottom row */}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {bot.conversations.toLocaleString()} conversations
                    </span>
                    <span>Updated {bot.lastTrained}</span>
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
