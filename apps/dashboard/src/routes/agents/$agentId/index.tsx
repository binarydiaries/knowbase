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
import { AGENT_LIMIT_TOOLTIP } from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { SubscriptionLimitBanner } from '@/components/SubscriptionLimitBanner/SubscriptionLimitBanner.tsx';
import { getAgentsById } from '@/services';
import { useBehaviour } from '@/store/useBehaviour.ts';
import { useChannels } from '@/store/useChannels.ts';
import { useDocuments } from '@/store/useDocuments.ts';
import ActionsCard from '@/widgets/ActionsCard/ActionsCard.tsx';
import { AgentMenuActions } from '@/widgets/AgentMenuActions/AgentMenuActions.tsx';
import { AgentPreview } from '@/widgets/AgentPreview/AgentPreview.tsx';
import { AgentUseWidget } from '@/widgets/AgentUseWidget/AgentUseWidget.tsx';
import BehaviourCard from '@/widgets/BehaviourCard/BehaviourCard.tsx';
import ChannelCard from '@/widgets/ChannelCard/ChannelCard.tsx';
import WhatsAppChannelCard from '@/widgets/ChannelCard/WhatsAppChannelCard.tsx';
import SlackChannelCard from '@/widgets/ChannelCard/SlackChannelCard.tsx';
import { DocumentsWidget } from '@/widgets/DocumentsWidget/DocumentsWidget.tsx';

export const Route = createFileRoute('/agents/$agentId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { agentId } = Route.useParams();
  const setDocuments = useDocuments((state) => state.setDocuments);
  const setChannels = useChannels((state) => state.setChannels);
  const setBehaviour = useBehaviour((state) => state.setBehaviour);
  const behaviour = useBehaviour((state) => state.behaviourByAgentId[agentId]);

  const query = useQuery({
    queryFn: async () => {
      return getAgentsById({
        path: {
          id: agentId,
        },
      });
    },
    queryKey: ['agent', agentId],
  });

  useEffect(() => {
    if (query.data?.data.documents && agentId && query.data?.data.behaviour) {
      setDocuments(agentId, query.data?.data.documents);
      setChannels(agentId, query.data.data.channels);
      setBehaviour(agentId, query?.data?.data?.behaviour);
    }
  }, [
    query.data?.data.documents,
    agentId,
    setDocuments,
    query.data?.data.channels,
    setChannels,
    query.data?.data.behaviour,
    setBehaviour,
  ]);

  const agent = query.data?.data.agent;
  const subscription = query.data?.data.subscription;
  const readOnly = !!subscription?.isOverLimit;
  const disableUnarchive =
    (subscription?.activeAgentCount ?? 0) >=
      (subscription?.activeAgentLimit ?? Number.MAX_SAFE_INTEGER) &&
    agent?.agentStatus === 'archived';

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
                  <Link to={'/agents'}>Agents</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{agent?.name || agentId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <AgentUseWidget />
            {agent && (
              <AgentMenuActions
                agentStatus={agent.agentStatus}
                agentName={agent.name}
                disableUnarchive={disableUnarchive}
                disableUnarchiveReason={AGENT_LIMIT_TOOLTIP}
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
            {import.meta.env.VITE_SLACK_ENABLED === 'true' && (
              <SlackChannelCard readOnly={readOnly} />
            )}
            <ActionsCard readOnly={readOnly} />
          </div>
          <div className="w-130 shrink-0 flex-col gap-5 hidden md:flex overflow-hidden">
            <Badge variant="secondary" className="rounded-l-none">
              Web Preview
            </Badge>
            <div className="h-full flex justify-center pb-5 max-h-175">
              <AgentPreview />
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
