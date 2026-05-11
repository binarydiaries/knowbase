import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Label } from '@knowbase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { toast } from '@knowbase/ui/components/sonner';
import { cn } from '@knowbase/ui/lib/utils';
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
import type { SlackChannel } from '@/store/useSlackConnection.ts';
import { useSlackConnection } from '@/store/useSlackConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

type SlackMode = 'channel' | 'mention';

interface ConnectionResponse {
  connected: boolean;
  teamName: string | null;
  channels: SlackChannel[];
}

const MODES: { value: SlackMode; label: string }[] = [
  { value: 'channel', label: 'Channel' },
  { value: 'mention', label: 'Mention' },
];

const SlackChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  if (!agentId) throw new Error('agentId not available');

  const channelSlack = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (c) => c.additional.type === 'slack',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);
  const setChannels = useChannels((s) => s.setChannels);
  const { connected, slackChannels, setConnection, updateChannelBinding } =
    useSlackConnection();

  // Derive slackConfig early so it can seed initial state below
  const slackConfigInitial =
    channelSlack?.additional.type === 'slack'
      ? (channelSlack.additional.config as { mode?: SlackMode })
      : undefined;

  const [selectedMode, setSelectedMode] = useState<SlackMode>(
    slackConfigInitial?.mode ?? 'channel',
  );
  const [selectedSlackChannelId, setSelectedSlackChannelId] =
    useState<string>('');
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);

  useQuery({
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
    enabled: !connected,
    staleTime: 60_000,
  });

  const slackConfig =
    channelSlack?.additional.type === 'slack'
      ? (channelSlack.additional.config as {
          mode?: SlackMode;
          slackChannelName?: string;
        })
      : undefined;

  const isAssigned =
    channelSlack?.channelStatus === 'active' &&
    channelSlack?.additional.type === 'slack' &&
    !!slackConfig?.slackChannelName;

  const availableChannels = slackChannels.filter(
    (c) => !c.boundToAgentId || c.boundToAgentId === agentId,
  );

  const assignMutation = useMutation({
    mutationFn: async () => {
      let channelId: string;
      let wasCreated = false;

      if (!channelSlack) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createRes = await postChannels({
          body: {
            agentId,
            enabled: false,
            channelStatus: 'inactive',
            additional: { type: 'slack' as any, config: {} },
          },
        });
        channelId = createRes.data.channel.id;
        wasCreated = true;
      } else {
        channelId = channelSlack.id;
      }

      const sc = slackChannels.find(
        (c) => c.slackChannelId === selectedSlackChannelId,
      );

      const res = await client.post({
        url: '/slack/bind',
        body: {
          channelId,
          mode: selectedMode,
          ...(sc
            ? {
                slackChannelId: sc.slackChannelId,
                slackChannelName: sc.slackChannelName,
              }
            : {}),
        },
        responseType: 'json',
      });

      return {
        channel: (res.data as { channel: ChannelSchema }).channel,
        wasCreated,
        sc,
      };
    },
    onSuccess: ({ channel: updatedChannel, wasCreated, sc }) => {
      if (wasCreated) {
        const current = useChannels.getState().channelsByAgentId[agentId] ?? [];
        setChannels(agentId, [...current, updatedChannel]);
      } else {
        updateChannel(agentId, updatedChannel);
      }
      if (sc) {
        updateChannelBinding(sc.slackChannelId, agentId, null);
      }
      setSelectedSlackChannelId('');
      toast.success('Slack channel assigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      if (!channelSlack) return;
      const res = await client.delete({
        url: `/slack/bind/${channelSlack.id}`,
        responseType: 'json',
      });
      return (res.data as { channel: ChannelSchema }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(agentId, updatedChannel);
      const sc = slackChannels.find((c) => c.boundToAgentId === agentId);
      if (sc) {
        updateChannelBinding(sc.slackChannelId, null, null);
      }

      setUnassignConfirmOpen(false);
      toast.success('Slack channel unassigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // ── Free-plan gate ──────────────────────────────────────────────────────────
  if (!planLoading && !isPaid) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <LockIcon className="size-3.5 shrink-0" />
          Slack is available on paid plans.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── State 1: No org-level Slack connection ──────────────────────────────────
  if (!connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Connect your Slack workspace in Integrations to enable this channel.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── State 2: Assigned ───────────────────────────────────────────────────────
  if (isAssigned && slackConfig) {
    const displayLabel = `#${slackConfig.slackChannelName}`;
    const modeLabel = slackConfig.mode === 'mention' ? 'Mention' : 'Channel';

    return (
      <>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {modeLabel} mode · {displayLabel}
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
        <Dialog
          open={unassignConfirmOpen}
          onOpenChange={setUnassignConfirmOpen}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Unassign Slack channel?</DialogTitle>
              <DialogDescription>
                <strong>{displayLabel}</strong> will be unassigned from this
                agent. You can reassign it later.
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

  // ── State 3: Connected, not assigned — configuration form ───────────────────
  const canAssign = !!selectedSlackChannelId;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Trigger Mode</Label>
        <p className="text-xs text-muted-foreground">
          How this agent listens in Slack
        </p>
        <div className="flex rounded-md border overflow-hidden">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setSelectedMode(m.value);
                setSelectedSlackChannelId('');
              }}
              disabled={readOnly}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm border-r last:border-r-0 transition-colors',
                selectedMode === m.value
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-background text-foreground hover:bg-muted',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {(selectedMode === 'channel' || selectedMode === 'mention') && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Slack Channel</Label>
          <Select
            value={selectedSlackChannelId}
            onValueChange={setSelectedSlackChannelId}
            disabled={readOnly || availableChannels.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  availableChannels.length === 0
                    ? 'No channels available — invite the bot first'
                    : 'Select a channel…'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableChannels.map((c) => (
                <SelectItem key={c.slackChannelId} value={c.slackChannelId}>
                  #{c.slackChannelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end">
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            size="sm"
            disabled={readOnly || !canAssign || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DisabledTooltip>
      </div>
    </div>
  );
};

export default SlackChannelCard;
