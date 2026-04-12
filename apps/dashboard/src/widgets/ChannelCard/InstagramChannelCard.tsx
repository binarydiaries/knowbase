import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import {
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import type { ChannelSchema } from '@/services';
import { postChannels } from '@/services';
import { client } from '@/services/client.gen';
import { useChannels } from '@/store/useChannels.ts';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  pageId?: string;
  instagramAccountId?: string;
  username?: string | null;
  boundToChatbotId?: string | null;
  chatbotName?: string | null;
}

const InstagramChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
  const { chatbotId } = useParams({ strict: false });

  if (!chatbotId) throw new Error('ChatbotId not available');

  const channelInstagram = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (c) => c.additional.type === 'instagram',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);
  const setChannels = useChannels((s) => s.setChannels);
  const { connected, username, setConnection, updateBinding } =
    useInstagramConnection();

  // Fetch connection status if not already in store
  useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/instagram/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.pageId && data.instagramAccountId) {
        setConnection({
          pageId: data.pageId,
          instagramAccountId: data.instagramAccountId,
          username: data.username ?? null,
          boundToChatbotId: data.boundToChatbotId ?? null,
          chatbotName: data.chatbotName ?? null,
        });
      }
      return data;
    },
    enabled: !connected,
    staleTime: 60_000,
  });

  const isAssigned =
    channelInstagram?.channelStatus === 'active' &&
    channelInstagram?.additional.type === 'instagram' &&
    !!channelInstagram.additional.config.pageId;

  const displayUsername =
    channelInstagram?.additional.type === 'instagram'
      ? channelInstagram.additional.config.instagramUsername
      : undefined;

  const assignMutation = useMutation({
    mutationFn: async () => {
      let channelId: string;
      let wasCreated = false;

      if (!channelInstagram) {
        const createRes = await postChannels({
          body: {
            chatbotId,
            enabled: false,
            channelStatus: 'inactive',
            additional: { type: 'instagram', config: {} },
          },
        });
        channelId = createRes.data.channel.id;
        wasCreated = true;
      } else {
        channelId = channelInstagram.id;
      }

      const res = await client.post({
        url: '/instagram/bind',
        body: { channelId },
        responseType: 'json',
      });
      return {
        channel: (res.data as { channel: ChannelSchema }).channel,
        wasCreated,
      };
    },
    onSuccess: (result) => {
      const { channel: updatedChannel, wasCreated } = result;
      if (wasCreated) {
        const current =
          useChannels.getState().channelsByChatbotId[chatbotId] ?? [];
        setChannels(chatbotId, [...current, updatedChannel]);
      } else {
        updateChannel(chatbotId, updatedChannel);
      }
      updateBinding(chatbotId, null);
      posthog.capture('chatbot_channel_connected', {
        chatbot_id: chatbotId,
        channel_type: 'instagram',
      });
      toast.success('Instagram account assigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      if (!channelInstagram) return;
      const res = await client.delete({
        url: `/instagram/bind/${channelInstagram.id}`,
        responseType: 'json',
      });
      return (res.data as { channel: ChannelSchema }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(chatbotId, updatedChannel);
      updateBinding(null, null);
      posthog.capture('chatbot_channel_disconnected', {
        chatbot_id: chatbotId,
        channel_type: 'instagram',
      });
      toast.success('Instagram account unassigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // State 1: No Instagram connected at org level
  if (!connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l">Instagram Channel</CardTitle>
          <CardDescription>
            Connect your Instagram account in Integrations to enable this
            channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 2: Connected + assigned
  if (isAssigned) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l flex items-center gap-2">
            Instagram Channel
            <span className="size-2 rounded-full bg-green-500 inline-block" />
            <span className="text-sm font-normal text-muted-foreground">
              Active
            </span>
          </CardTitle>
          <CardDescription>
            {displayUsername ? `@${displayUsername}` : username ? `@${username}` : 'Connected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
            <Button
              variant="outline"
              size="sm"
              disabled={readOnly || unassignMutation.isPending}
              onClick={() => unassignMutation.mutate()}
            >
              {unassignMutation.isPending ? 'Unassigning…' : 'Unassign'}
            </Button>
          </DisabledTooltip>
        </CardContent>
      </Card>
    );
  }

  // State 3: Connected + not assigned
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-l">Instagram Channel</CardTitle>
        <CardDescription>
          Assign your connected Instagram account{username ? ` (@${username})` : ''} to this chatbot.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
          <Button
            size="sm"
            disabled={readOnly || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DisabledTooltip>
      </CardContent>
    </Card>
  );
};

export default InstagramChannelCard;
