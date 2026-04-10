import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { Badge } from '@knowbase/ui/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@knowbase/ui/components/breadcrumb';
import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Spinner } from '@knowbase/ui/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useEffect } from 'react';
import { CHATBOT_LIMIT_TOOLTIP } from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { SubscriptionLimitBanner } from '@/components/SubscriptionLimitBanner/SubscriptionLimitBanner.tsx';
import { getChatbotsById } from '@/services';
import { useBehaviour } from '@/store/useBehaviour.ts';
import { useChannels } from '@/store/useChannels.ts';
import { useDocuments } from '@/store/useDocuments.ts';
import BehaviourCard from '@/widgets/BehaviourCard/BehaviourCard.tsx';
import ChannelCard from '@/widgets/ChannelCard/ChannelCard.tsx';
import WhatsAppChannelCard from '@/widgets/ChannelCard/WhatsAppChannelCard.tsx';
import { ChatbotMenuActions } from '@/widgets/ChatbotMenuActions/ChatbotMenuActions.tsx';
import { ChatbotPreview } from '@/widgets/ChatbotPreview/ChatbotPreview.tsx';
import { ChatbotUseWidget } from '@/widgets/ChatbotUseWidget/ChatbotUseWidget.tsx';
import { DocumentsWidget } from '@/widgets/DocumentsWidget/DocumentsWidget.tsx';

export const Route = createFileRoute('/chatbots/$chatbotId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatbotId } = Route.useParams();
  const setDocuments = useDocuments((state) => state.setDocuments);
  const setChannels = useChannels((state) => state.setChannels);
  const setBehaviour = useBehaviour((state) => state.setBehaviour);
  const behaviour = useBehaviour(
    (state) => state.behaviourByChatbotId[chatbotId],
  );

  const query = useQuery({
    queryFn: async () => {
      return getChatbotsById({
        path: {
          id: chatbotId,
        },
      });
    },
    queryKey: ['chatbot', chatbotId],
  });

  useEffect(() => {
    if (query.data?.data.documents && chatbotId && query.data?.data.behaviour) {
      setDocuments(chatbotId, query.data?.data.documents);
      setChannels(chatbotId, query.data.data.channels);
      setBehaviour(chatbotId, query?.data?.data?.behaviour);
    }
  }, [
    query.data?.data.documents,
    chatbotId,
    setDocuments,
    query.data?.data.channels,
    setChannels,
    query.data?.data.behaviour,
    setBehaviour,
  ]);

  const chatbot = query.data?.data.chatbot;
  const subscription = query.data?.data.subscription;
  const readOnly = !!subscription?.isOverLimit;
  const disableUnarchive =
    (subscription?.activeChatbotCount ?? 0) >=
      (subscription?.activeChatbotLimit ?? Number.MAX_SAFE_INTEGER) &&
    chatbot?.chatbotStatus === 'archived';

  return (
    <div className="h-screen flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to={'/chatbots'}>Chatbots</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{chatbot?.name || chatbotId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <ChatbotUseWidget />
            {chatbot && (
              <ChatbotMenuActions
                chatbotStatus={chatbot.chatbotStatus}
                disableUnarchive={disableUnarchive}
                disableUnarchiveReason={CHATBOT_LIMIT_TOOLTIP}
              />
            )}
          </div>
        </div>
      </header>
      <Separator />

      {query.isSuccess && (
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="grow p-5 shadow-none flex-col flex gap-5 h-full overflow-auto border-r">
            <SubscriptionLimitBanner subscription={subscription} />
            <DocumentsWidget readOnly={readOnly} subscription={subscription} />
            {behaviour && <BehaviourCard readOnly={readOnly} />}
            <ChannelCard readOnly={readOnly} />
            <WhatsAppChannelCard readOnly={readOnly} />
          </div>
          <div className="w-130 shrink-0 flex-col gap-5 hidden md:flex">
            <Badge variant="secondary" className="rounded-l-none">
              Web Preview
            </Badge>
            <div className="h-full flex justify-center pb-5">
              <ChatbotPreview />
            </div>
          </div>
        </div>
      )}

      {query.isLoading && (
        <div className="flex flex-1 h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      )}

      {query.isError && (
        <div className="flex flex-1 h-full items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              There is an error at our side, Please try again after sometime
            </AlertDescription>
            <AlertAction>
              <Button
                size="xs"
                variant="destructive"
                onClick={() => query.refetch()}
              >
                Retry
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}
    </div>
  );
}
