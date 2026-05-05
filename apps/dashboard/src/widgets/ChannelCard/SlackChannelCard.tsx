import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
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
import type { SlackChannel } from '@/store/useSlackConnection.ts';
import { useSlackConnection } from '@/store/useSlackConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

type SlackMode = 'channel' | 'mention' | 'command';

interface ConnectionResponse {
  connected: boolean;
  teamName: string | null;
  channels: SlackChannel[];
}

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

  const [selectedMode, setSelectedMode] = useState<SlackMode>('channel');
  const [selectedSlackChannelId, setSelectedSlackChannelId] =
    useState<string>('');
  const [commandName, setCommandName] = useState<string>('');
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);

  // Fetch connection status if not already in store
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
          slackCommand?: string;
        })
      : undefined;

  const isAssigned =
    channelSlack?.channelStatus === 'active' &&
    channelSlack?.additional.type === 'slack' &&
    !!(slackConfig?.slackChannelName || slackConfig?.slackCommand);

  // Channels available to assign (not already bound to another agent)
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

      const sc =
        selectedMode !== 'command'
          ? slackChannels.find(
              (c) => c.slackChannelId === selectedSlackChannelId,
            )
          : null;

      const res = await client.post({
        url: '/slack/bind',
        body: {
          channelId,
          mode: selectedMode,
          ...(selectedMode !== 'command' && sc
            ? {
                slackChannelId: sc.slackChannelId,
                slackChannelName: sc.slackChannelName,
              }
            : {}),
          ...(selectedMode === 'command' ? { slackCommand: commandName.trim() } : {}),
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
      setCommandName('');
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

  // Free-plan gate
  if (!planLoading && !isPaid) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l flex items-center gap-2">
            Slack Channel
            <LockIcon className="size-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Slack is available on paid plans.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 1: No Slack connection at org level
  if (!connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l">Slack Channel</CardTitle>
          <CardDescription>
            Connect your Slack workspace in Integrations to enable this channel.
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
  if (isAssigned && slackConfig) {
    const displayLabel =
      slackConfig.mode === 'command'
        ? `/${slackConfig.slackCommand}`
        : `#${slackConfig.slackChannelName}`;

    const modeLabel =
      slackConfig.mode === 'channel'
        ? 'Channel'
        : slackConfig.mode === 'mention'
          ? 'Mention'
          : 'Command';

    return (
      <>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-l flex items-center gap-2">
              Slack Channel
              <span className="size-2 rounded-full bg-green-500 inline-block" />
              <span className="text-sm font-normal text-muted-foreground">
                Active
              </span>
            </CardTitle>
            <CardDescription>
              {modeLabel} mode · {displayLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
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
          </CardContent>
        </Card>
        <Dialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
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

  // State 3: Connected, not assigned — mode picker + assignment form
  const canAssign =
    selectedMode === 'command'
      ? !!commandName.trim()
      : !!selectedSlackChannelId;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-l">Slack Channel</CardTitle>
        <CardDescription>
          Choose how this agent responds in Slack.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Mode</Label>
          <Select
            value={selectedMode}
            onValueChange={(v) => {
              setSelectedMode(v as SlackMode);
              setSelectedSlackChannelId('');
              setCommandName('');
            }}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="channel">
                Channel — respond to all messages in a channel
              </SelectItem>
              <SelectItem value="mention">
                Mention — respond when @mentioned in a channel
              </SelectItem>
              <SelectItem value="command">
                Command — respond to a slash command (/cmd)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Channel picker (channel + mention modes) */}
        {(selectedMode === 'channel' || selectedMode === 'mention') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Slack Channel
            </Label>
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

        {/* Command name (command mode) */}
        {selectedMode === 'command' && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Slash Command Name
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                placeholder="ask"
                value={commandName}
                onChange={(e) =>
                  setCommandName(
                    e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase(),
                  )
                }
                disabled={readOnly}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Users will type /{commandName || 'command'} followed by their
              message. Responses are only visible to the sender.
            </p>
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
      </CardContent>
    </Card>
  );
};

export default SlackChannelCard;
