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
import { cn } from '@knowbase/ui/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { Loader2, LockIcon } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
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

const MODES: { value: SlackMode; label: string }[] = [
  { value: 'channel', label: 'Channel' },
  { value: 'mention', label: 'Mention' },
  { value: 'command', label: 'Command' },
];

const SlackChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
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
  const [commandKeyword, setCommandKeyword] = useState<string>('');
  const [commandChannelId, setCommandChannelId] = useState<string>('');
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
          commandKeyword?: string;
          commandChannelId?: string;
          commandChannelName?: string;
        })
      : undefined;

  const isAssigned =
    channelSlack?.channelStatus === 'active' &&
    channelSlack?.additional.type === 'slack' &&
    !!(slackConfig?.slackChannelName || slackConfig?.commandKeyword);

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

      const restrictedChannel =
        selectedMode === 'command' && commandChannelId
          ? slackChannels.find((c) => c.slackChannelId === commandChannelId)
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
          ...(selectedMode === 'command'
            ? {
                commandKeyword: commandKeyword.trim(),
                ...(restrictedChannel
                  ? {
                      commandChannelId: restrictedChannel.slackChannelId,
                      commandChannelName: restrictedChannel.slackChannelName,
                    }
                  : {}),
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
      setCommandKeyword('');
      setCommandChannelId('');
      posthog.capture('agent_channel_connected', {
        agent_id: agentId,
        channel_type: 'slack',
        mode: selectedMode,
      });
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
      posthog.capture('agent_channel_disconnected', {
        agent_id: agentId,
        channel_type: 'slack',
      });
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

  // ── State 1: No org-level Slack connection ──────────────────────────────────
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

  // ── State 2: Assigned ───────────────────────────────────────────────────────
  if (isAssigned && slackConfig) {
    const displayLabel =
      slackConfig.mode === 'command'
        ? `/agent ${slackConfig.commandKeyword}`
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
              {slackConfig.mode === 'command' && slackConfig.commandChannelName && (
                <> · #{slackConfig.commandChannelName}</>
              )}
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

  // ── State 3: Connected, not assigned — configuration form ───────────────────
  const canAssign =
    selectedMode === 'command'
      ? !!commandKeyword.trim()
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
        {/* Trigger Mode — segmented buttons */}
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
                  setCommandKeyword('');
                  setCommandChannelId('');
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

        {/* Channel picker — channel + mention modes */}
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

        {/* Command mode */}
        {selectedMode === 'command' && (
          <>
            {/* Explanation box */}
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Users type{' '}
              <code className="font-mono text-xs">/agent &lt;keyword&gt; question</code>{' '}
              in any Slack channel. The keyword routes the message to this
              specific agent.
            </div>

            {/* Agent Keyword input */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Agent Keyword
              </Label>
              <div className="flex rounded-md border overflow-hidden">
                <span className="px-3 py-2 text-sm bg-muted text-muted-foreground border-r font-mono shrink-0">
                  /agent
                </span>
                <Input
                  placeholder="support"
                  value={commandKeyword}
                  onChange={(e) =>
                    setCommandKeyword(
                      e.target.value
                        .replace(/[^a-z0-9_-]/gi, '')
                        .toLowerCase(),
                    )
                  }
                  disabled={readOnly}
                  className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Restrict to channel (optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Restrict to channel{' '}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Select
                value={commandChannelId}
                onValueChange={setCommandChannelId}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any channel</SelectItem>
                  {slackChannels.map((c) => (
                    <SelectItem
                      key={c.slackChannelId}
                      value={c.slackChannelId}
                    >
                      #{c.slackChannelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {commandKeyword && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Preview
                </Label>
                <div className="rounded-md border bg-background p-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="size-7 rounded bg-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-xs">User</span>
                      <p className="text-sm mt-0.5">
                        <span className="text-blue-500 font-mono text-xs">
                          /agent
                        </span>{' '}
                        <span className="text-green-600 font-mono text-xs font-semibold">
                          {commandKeyword}
                        </span>{' '}
                        what is your refund policy?
                      </p>
                    </div>
                  </div>
                  <div className="ml-9 rounded border-l-2 border-muted-foreground/20 pl-3 py-1">
                    <span className="font-semibold text-xs">Agenvik </span>
                    <span className="text-xs bg-muted rounded px-1 py-0.5">
                      APP
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Replying as this agent — only visible to the sender.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info note */}
            <div className="flex gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span className="shrink-0">ℹ️</span>
              <span>
                Register{' '}
                <code className="font-mono">/agent</code> once in your Slack
                App dashboard. Each agent gets a unique keyword — users reach
                different agents with{' '}
                <code className="font-mono">/agent support …</code> or{' '}
                <code className="font-mono">/agent sales …</code>
              </span>
            </div>
          </>
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
