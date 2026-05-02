import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink, LockIcon } from 'lucide-react';
import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Link } from '@tanstack/react-router';
import { useClerkPlan } from '@/hooks/useClerkPlan.ts';
import { client } from '@/services/client.gen';
import {
  useSlackConnection,
  type SlackChannel,
} from '@/store/useSlackConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  teamName: string | null;
  channels: SlackChannel[];
}

export function SlackIntegrationCard() {
  const posthog = usePostHog();
  const { connected, teamName, slackChannels, setConnection, clearConnection } =
    useSlackConnection();
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  // Detect redirect back from Slack OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_connected') === '1') {
      toast.success('Slack workspace connected');
      params.delete('slack_connected');
      const newSearch = params.toString();
      window.history.replaceState(
        {},
        '',
        newSearch ? `?${newSearch}` : window.location.pathname,
      );
    } else if (params.get('slack_error') === '1') {
      toast.error('Failed to connect Slack. Please try again.');
      params.delete('slack_error');
      window.history.replaceState(
        {},
        '',
        window.location.pathname,
      );
    }
  }, []);

  const { isLoading } = useQuery({
    queryKey: ['slack-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/slack/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.teamName) {
        setConnection({ teamName: data.teamName, channels: data.channels });
      }
      return data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await client.get({
        url: '/slack/oauth/start',
        responseType: 'json',
      });
      return res.data as { url: string };
    },
    onSuccess: ({ url }) => {
      posthog.capture('slack_oauth_started');
      window.location.href = url;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await client.delete({
        url: '/slack/connection',
        responseType: 'json',
      });
    },
    onSuccess: () => {
      clearConnection();
      posthog.capture('slack_disconnected');
      toast.success('Slack disconnected');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Slack logo */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4A154B]">
            <svg
              viewBox="0 0 24 24"
              className="size-6 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">Slack</CardTitle>
            <CardDescription className="text-sm">
              {connected && teamName
                ? `Connected to ${teamName}`
                : 'Connect your Slack workspace via OAuth.'}
            </CardDescription>
          </div>
        </div>
        {isPaid && connected && (
          <Badge
            variant="outline"
            className="shrink-0 text-green-600 border-green-300 bg-green-50"
          >
            <span className="size-1.5 rounded-full bg-green-500 mr-1.5 inline-block" />
            Connected
          </Badge>
        )}
      </CardHeader>

      {!planLoading && !isPaid && (
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="rounded-full border p-3">
            <LockIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            Slack integration is available on paid plans. Upgrade to connect
            your workspace.
          </p>
          <Button size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </CardContent>
      )}

      {isPaid && !connected && !isLoading && (
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You'll be redirected to Slack to authorize the bot for your
            workspace.
          </p>
          <div className="flex items-center justify-between">
            <a
              href="https://api.slack.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              Slack App setup guide
            </a>
            <Button
              size="sm"
              disabled={connectMutation.isPending}
              onClick={() => connectMutation.mutate()}
            >
              {connectMutation.isPending
                ? 'Redirecting…'
                : 'Connect with Slack'}
            </Button>
          </div>
        </CardContent>
      )}

      {isPaid && connected && (
        <CardContent className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bot-joined Channels
            </p>
            {slackChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No channels found. Invite the bot to a channel first.
              </p>
            ) : (
              <div className="space-y-2">
                {slackChannels.map((ch) => (
                  <SlackChannelRow key={ch.slackChannelId} channel={ch} />
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={disconnectMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    'This will disable all Slack channels across your agents. Continue?',
                  )
                ) {
                  disconnectMutation.mutate();
                }
              }}
            >
              {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SlackChannelRow({ channel }: { channel: SlackChannel }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span className="font-medium">#{channel.slackChannelName}</span>
      {channel.boundToAgentId ? (
        <Badge variant="secondary">{channel.agentName ?? 'Bound'}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      )}
    </div>
  );
}
