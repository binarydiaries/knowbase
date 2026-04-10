import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import {
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { client } from '@/services/client.gen';
import { useChannels } from '@/store/useChannels.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

declare global {
  interface Window {
    FB?: {
      init: (options: {
        appId: string;
        version: string;
        xfbml?: boolean;
        cookie?: boolean;
      }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: { scope: string; extras: Record<string, unknown> },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const WhatsAppChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
  const { chatbotId } = useParams({ strict: false });
  const fbSdkLoaded = useRef(false);

  if (!chatbotId) throw new Error('ChatbotId not available');

  const channelWhatsApp = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (c) => c.additional.type === 'whatsapp',
    ),
  );
  const updateChannel = useChannels((s) => s.updateChannel);

  const isConnected =
    channelWhatsApp?.channelStatus === 'active' &&
    channelWhatsApp?.additional.type === 'whatsapp' &&
    !!channelWhatsApp.additional.config.displayPhone;

  const displayPhone =
    channelWhatsApp?.additional.type === 'whatsapp'
      ? channelWhatsApp.additional.config.displayPhone
      : undefined;

  // Load Facebook JS SDK once
  useEffect(() => {
    if (fbSdkLoaded.current || !import.meta.env.VITE_FACEBOOK_APP_ID) return;
    fbSdkLoaded.current = true;

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID as string,
        version: 'v19.0',
        cookie: true,
        xfbml: false,
      });
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const connectMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!channelWhatsApp) return;
      const res = await client.post({
        url: '/whatsapp/connect',
        body: { code, channelId: channelWhatsApp.id },
        responseType: 'json',
      });
      return (res.data as { channel: typeof channelWhatsApp }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(chatbotId, updatedChannel);
      posthog.capture('chatbot_channel_connected', {
        chatbot_id: chatbotId,
        channel_type: 'whatsapp',
      });
      toast.success('WhatsApp connected successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!channelWhatsApp) return;
      const res = await client.delete({
        url: `/whatsapp/connect/${channelWhatsApp.id}`,
        responseType: 'json',
      });
      return (res.data as { channel: typeof channelWhatsApp }).channel;
    },
    onSuccess: (updatedChannel) => {
      if (!updatedChannel) return;
      updateChannel(chatbotId, updatedChannel);
      posthog.capture('chatbot_channel_disconnected', {
        chatbot_id: chatbotId,
        channel_type: 'whatsapp',
      });
      toast.success('WhatsApp disconnected');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleConnect = () => {
    if (!window.FB) {
      toast.error('Facebook SDK not loaded yet. Please try again.');
      return;
    }

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (code) {
          connectMutation.mutate(code);
        } else {
          toast.error('WhatsApp login was cancelled or failed.');
        }
      },
      {
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          feature: 'whatsapp_embedded_signup',
          setup: {},
        },
      },
    );
  };

  if (!channelWhatsApp) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-l">WhatsApp Channel</CardTitle>
        <CardDescription>
          {isConnected
            ? 'Your WhatsApp Business number is connected.'
            : 'Connect your WhatsApp Business number to receive and reply to messages.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 inline-block" />
              <span className="font-medium text-sm">{displayPhone}</span>
            </div>
            <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
              <Button
                variant="outline"
                size="sm"
                disabled={readOnly || disconnectMutation.isPending}
                onClick={() => disconnectMutation.mutate()}
              >
                {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </DisabledTooltip>
          </>
        ) : (
          <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
            <Button
              disabled={readOnly || connectMutation.isPending}
              onClick={handleConnect}
            >
              {connectMutation.isPending ? 'Connecting…' : 'Connect WhatsApp'}
            </Button>
          </DisabledTooltip>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppChannelCard;
