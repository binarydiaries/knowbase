import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
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
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import {
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { client } from '@/services/client.gen';
import { useChannels } from '@/store/useChannels.ts';
import { useWhatsAppConnection } from '@/store/useWhatsAppConnection.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import type { ChannelSchema } from '@/services';
import type { WhatsAppPhoneNumber } from '@/store/useWhatsAppConnection.ts';

interface ConnectionResponse {
  connected: boolean;
  businessAccountId?: string;
  phoneNumbers: WhatsAppPhoneNumber[];
}

const WhatsAppChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
  const { chatbotId } = useParams({ strict: false });

  if (!chatbotId) throw new Error('ChatbotId not available');

  const channelWhatsApp = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (c) => c.additional.type === 'whatsapp',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);
  const { connected, phoneNumbers, setConnection, updatePhoneBinding } =
    useWhatsAppConnection();

  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string>('');

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

  // Numbers not bound to any other chatbot (available to assign to this one)
  const availableNumbers = phoneNumbers.filter(
    (p) =>
      !p.boundToChatbotId || p.boundToChatbotId === chatbotId,
  );

  const assignMutation = useMutation({
    mutationFn: async () => {
      const phone = phoneNumbers.find(
        (p) => p.phoneNumberId === selectedPhoneNumberId,
      );
      if (!channelWhatsApp || !phone) return;
      const res = await client.post({
        url: '/whatsapp/bind',
        body: {
          channelId: channelWhatsApp.id,
          phoneNumberId: phone.phoneNumberId,
          displayPhone: phone.displayPhone,
        },
        responseType: 'json',
      });
      return (res.data as { channel: ChannelSchema }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(chatbotId, updatedChannel);
      const phone = phoneNumbers.find(
        (p) => p.phoneNumberId === selectedPhoneNumberId,
      );
      if (phone) {
<<<<<<< HEAD
        updatePhoneBinding(phone.phoneNumberId, chatbotId, undefined ?? null);
=======
        updatePhoneBinding(phone.phoneNumberId, chatbotId, null);
>>>>>>> main
      }
      setSelectedPhoneNumberId('');
      posthog.capture('chatbot_channel_connected', {
        chatbot_id: chatbotId,
        channel_type: 'whatsapp',
      });
      toast.success('Phone number assigned');
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
      updateChannel(chatbotId, updatedChannel);
      // Find and unbind the phone in the store
      const phone = phoneNumbers.find((p) => p.boundToChatbotId === chatbotId);
      if (phone) {
        updatePhoneBinding(phone.phoneNumberId, null, null);
      }
      posthog.capture('chatbot_channel_disconnected', {
        chatbot_id: chatbotId,
        channel_type: 'whatsapp',
      });
      toast.success('Phone number unassigned');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (!channelWhatsApp) return null;

  // State 1: No WABA connected at org level
  if (!connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l">WhatsApp Channel</CardTitle>
          <CardDescription>
            Connect your WhatsApp Business Account in Integrations to enable
            this channel.
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

  // State 2: WABA connected, number assigned
  if (isAssigned) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l flex items-center gap-2">
            WhatsApp Channel
            <span className="size-2 rounded-full bg-green-500 inline-block" />
            <span className="text-sm font-normal text-muted-foreground">
              Active
            </span>
          </CardTitle>
          <CardDescription>{displayPhone}</CardDescription>
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

  // State 3: WABA connected, no number bound — show picker
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-l">WhatsApp Channel</CardTitle>
        <CardDescription>
          Assign a phone number from your connected WhatsApp Business Account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
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
        <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
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
      </CardContent>
    </Card>
  );
};

export default WhatsAppChannelCard;
