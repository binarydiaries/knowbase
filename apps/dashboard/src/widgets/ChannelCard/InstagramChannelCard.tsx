import * as amplitude from '@amplitude/unified';
import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { Loader2, LockIcon } from 'lucide-react';
import { useState } from 'react';
import {
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { useClerkPlan } from '@/hooks/useClerkPlan.ts';
import type { ChannelSchema } from '@/services';
import { postChannels } from '@/services';
import { client } from '@/services/client.gen';
import { useChannels } from '@/store/useChannels.ts';
import { useInstagramConnection } from '@/store/useInstagramConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  instagramAccountId?: string;
  username?: string | null;
  boundToAgentId?: string | null;
  agentName?: string | null;
}

const InstagramChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  if (!agentId) throw new Error('agentId not available');

  const channelInstagram = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (c) => c.additional.type === 'instagram',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);
  const setChannels = useChannels((s) => s.setChannels);
  const { connected, username, boundToAgentId, setConnection, updateBinding } =
    useInstagramConnection();

  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);

  // Fetch connection status if not already in store
  useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/instagram/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.instagramAccountId) {
        setConnection({
          instagramAccountId: data.instagramAccountId,
          username: data.username ?? null,
          boundToAgentId: data.boundToAgentId ?? null,
          agentName: data.agentName ?? null,
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
    !!(channelInstagram.additional.config as { instagramAccountId?: string }).instagramAccountId;

  const displayUsername =
    channelInstagram?.additional.type === 'instagram'
      ? (channelInstagram.additional.config as { username?: string }).username
      : undefined;

  const isAlreadyBoundElsewhere = !!boundToAgentId && boundToAgentId !== agentId;

  const assignMutation = useMutation({
    mutationFn: async () => {
      let channelId: string;
      let wasCreated = false;

      if (!channelInstagram) {
        const createRes = await postChannels({
          body: {
            agentId,
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
      if (!result) return;
      const { channel: updatedChannel, wasCreated } = result;
      if (wasCreated) {
        const current = useChannels.getState().channelsByAgentId[agentId] ?? [];
        setChannels(agentId, [...current, updatedChannel]);
      } else {
        updateChannel(agentId, updatedChannel);
      }
      updateBinding(agentId, null);
      toast.success('Instagram account assigned');
      amplitude.track('Instagram Channel Connected', { agent_id: agentId });
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
      updateChannel(agentId, updatedChannel);
      updateBinding(null, null);
      setUnassignConfirmOpen(false);
      toast.success('Instagram account unassigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Free-plan gate
  if (!planLoading && !isPaid) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <LockIcon className="size-3.5 shrink-0" />
          Instagram is available on paid plans.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 1: No Instagram connected at org level
  if (!connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Connect your Instagram Business Account in Integrations to enable this channel.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Connected, assigned to this agent
  if (isAssigned) {
    return (
      <>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {displayUsername ? `@${displayUsername}` : 'Instagram account assigned'}
          </p>
          <div className="flex justify-end">
            <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
              <Button
                variant="outline"
                size="sm"
                disabled={readOnly || unassignMutation.isPending}
                onClick={() => setUnassignConfirmOpen(true)}
              >
                Unassign
              </Button>
            </DisabledTooltip>
          </div>
        </div>
        <Dialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Unassign Instagram account?</DialogTitle>
              <DialogDescription>
                {displayUsername ? (
                  <>
                    <strong>@{displayUsername}</strong> will be unassigned from this agent.
                    You can reassign it later.
                  </>
                ) : (
                  'The Instagram account will be unassigned from this agent.'
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUnassignConfirmOpen(false)}
                disabled={unassignMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => unassignMutation.mutate()}
                disabled={unassignMutation.isPending}
              >
                {unassignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Unassign'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // State 3: Connected, but bound to another agent
  if (isAlreadyBoundElsewhere) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {username ? `@${username}` : 'Your Instagram account'} is already assigned to another agent.
          Unassign it there first.
        </p>
      </div>
    );
  }

  // State 4: Connected, not bound anywhere — show assign button
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Assign your connected Instagram account{username ? ` (@${username})` : ''} to this agent.
      </p>
      <div className="flex justify-end">
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            size="sm"
            disabled={readOnly || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DisabledTooltip>
      </div>
    </div>
  );
};

export default InstagramChannelCard;
