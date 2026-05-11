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
import type { WhatsAppPhoneNumber } from '@/store/useWhatsAppConnection.ts';
import { useWhatsAppConnection } from '@/store/useWhatsAppConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

interface ConnectionResponse {
  connected: boolean;
  businessAccountId?: string;
  phoneNumbers: WhatsAppPhoneNumber[];
}

const WhatsAppChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  const { isPaid, isLoading: planLoading } = useClerkPlan();

  if (!agentId) throw new Error('agentId not available');

  const channelWhatsApp = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (c) => c.additional.type === 'whatsapp',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);
  const setChannels = useChannels((s) => s.setChannels);
  const { connected, phoneNumbers, setConnection, updatePhoneBinding } =
    useWhatsAppConnection();

  const [selectedPhoneNumberId, setSelectedPhoneNumberId] =
    useState<string>('');
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);

  // Fetch connection status if not already in store
  useQuery({
    queryKey: ['whatsapp-connection'],
    queryFn: async () => {
      const res = await client.get({
        url: '/whatsapp/connection',
        responseType: 'json',
      });
      const data = res.data as ConnectionResponse;
      if (data.connected && data.businessAccountId) {
        setConnection({
          businessAccountId: data.businessAccountId,
          phoneNumbers: data.phoneNumbers,
        });
      }
      return data;
    },
    // Don't re-fetch if already connected in store
    enabled: !connected,
    staleTime: 60_000,
  });

  const isAssigned =
    channelWhatsApp?.channelStatus === 'active' &&
    channelWhatsApp?.additional.type === 'whatsapp' &&
    !!channelWhatsApp.additional.config.displayPhone;

  const displayPhone =
    channelWhatsApp?.additional.type === 'whatsapp'
      ? channelWhatsApp.additional.config.displayPhone
      : undefined;

  // Numbers not bound to any other agent (available to assign to this one)
  const availableNumbers = phoneNumbers.filter(
    (p) => !p.boundToAgentId || p.boundToAgentId === agentId,
  );

  const assignMutation = useMutation({
    mutationFn: async () => {
      const phone = phoneNumbers.find(
        (p) => p.phoneNumberId === selectedPhoneNumberId,
      );
      if (!phone) return null;

      let channelId: string;
      let wasCreated = false;

      if (!channelWhatsApp) {
        const createRes = await postChannels({
          body: {
            agentId,
            enabled: false,
            channelStatus: 'inactive',
            additional: { type: 'whatsapp', config: {} },
          },
        });
        channelId = createRes.data.channel.id;
        wasCreated = true;
      } else {
        channelId = channelWhatsApp.id;
      }

      const res = await client.post({
        url: '/whatsapp/bind',
        body: {
          channelId,
          phoneNumberId: phone.phoneNumberId,
          displayPhone: phone.displayPhone,
        },
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
        const current =
          useChannels.getState().channelsByAgentId[agentId] ?? [];
        setChannels(agentId, [...current, updatedChannel]);
      } else {
        updateChannel(agentId, updatedChannel);
      }
      const phone = phoneNumbers.find(
        (p) => p.phoneNumberId === selectedPhoneNumberId,
      );
      if (phone) {
        updatePhoneBinding(phone.phoneNumberId, agentId, null);
      }
      setSelectedPhoneNumberId('');
      toast.success('Phone number assigned');
      amplitude.track('WhatsApp Channel Connected', { agent_id: agentId });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      if (!channelWhatsApp) return;
      const res = await client.delete({
        url: `/whatsapp/bind/${channelWhatsApp.id}`,
        responseType: 'json',
      });
      return (res.data as { channel: ChannelSchema }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(agentId, updatedChannel);
      // Find and unbind the phone in the store
      const phone = phoneNumbers.find((p) => p.boundToAgentId === agentId);
      if (phone) {
        updatePhoneBinding(phone.phoneNumberId, null, null);
      }
      setUnassignConfirmOpen(false);
      toast.success('Phone number unassigned');
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
          WhatsApp is available on paid plans.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/subscriptions">Upgrade Plan</Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 1: No WABA connected at org level
  if (!connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Connect your WhatsApp Business Account in Integrations to enable this channel.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 2: WABA connected, number assigned
  if (isAssigned) {
    return (
      <>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{displayPhone}</p>
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
              <DialogTitle>Unassign phone number?</DialogTitle>
              <DialogDescription>
                The number <strong>{displayPhone}</strong> will be unassigned
                from this agent. You can reassign it later.
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

  // State 3: WABA connected, no number bound — show picker
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Assign a phone number from your connected WhatsApp Business Account.
      </p>
      <div className="flex items-center gap-3">
        <Select
          value={selectedPhoneNumberId}
          onValueChange={setSelectedPhoneNumberId}
          disabled={readOnly || availableNumbers.length === 0}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                availableNumbers.length === 0
                  ? 'No numbers available'
                  : 'Select a number…'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableNumbers.map((p) => (
              <SelectItem key={p.phoneNumberId} value={p.phoneNumberId}>
                {p.displayPhone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            size="sm"
            disabled={
              readOnly || !selectedPhoneNumberId || assignMutation.isPending
            }
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DisabledTooltip>
      </div>
    </div>
  );
};

export default WhatsAppChannelCard;
