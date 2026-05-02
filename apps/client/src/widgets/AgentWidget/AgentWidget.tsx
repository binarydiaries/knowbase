import { useChat } from '@ai-sdk/react';
import { Agent } from '@knowbase/ui/widgets/Agent/Agent';
import { VoiceCall } from '@knowbase/ui/widgets/VoiceCall/VoiceCall';
import { usePostHog } from '@posthog/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useId, useState } from 'react';
import { baseUrl } from '@/services/chat.ts';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';
import { parseChatError } from '@/utils/chatError.ts';

interface IAgentWidgetProps {
  channelSchema: ChannelSchema;
  orgId: string;
}

interface IAgentWidgetContentProps extends IAgentWidgetProps {
  onNewChat: () => void;
}

function buildVoiceWsUrl(apiBase: string, channelId: string, orgId: string, conversationId: string) {
  const wsBase = apiBase.replace(/^http/, 'ws');
  return `${wsBase}/voice/session?channelId=${channelId}&orgId=${orgId}&conversationId=${conversationId}`;
}

const AgentWidgetContent = ({
  channelSchema,
  orgId,
  onNewChat,
}: IAgentWidgetContentProps) => {
  const posthog = usePostHog();
  const channelConfig = channelSchema.additional.config;
  const initialMessageId = useId();
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();
  const [isCallActive, setIsCallActive] = useState(false);
  const [voiceConversationId, setVoiceConversationId] = useState<string>('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only event
  useEffect(() => {
    posthog?.capture('chat_widget_opened', {
      channel_id: channelSchema.id,
      org_id: orgId,
      agent_id: channelSchema.agentId,
      channel_name: channelConfig.displayName,
    });
  }, []);

  const initialMessage: UIMessage | undefined = channelConfig?.welcomeMessage
    ? {
        id: initialMessageId,
        role: 'system',
        parts: [{ type: 'text', text: channelConfig.welcomeMessage }],
      }
    : undefined;

  const { messages, sendMessage, status } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: baseUrl,
      prepareSendMessagesRequest({ messages, id }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find((v) => v.type === 'text');
        return {
          body: {
            message: messageText?.text,
            conversationId: id,
            channelId: channelSchema?.id,
            orgId,
          },
        };
      },
    }),
    onError(error) {
      const chatError = parseChatError(error);
      if (!chatError) return;

      if (chatError.code === 'MESSAGE_LIMIT_REACHED' && !isUsageExhausted) {
        setIsUsageExhausted(true);
        setAlertMessage(
          'This assistant is temporarily unavailable right now. Please try again later.',
        );
        posthog?.capture('chat_usage_limit_reached', {
          channel_id: channelSchema.id,
          org_id: orgId,
          agent_id: channelSchema.agentId,
        });
        return;
      }

      if (chatError.code && chatError.code !== 'MESSAGE_LIMIT_REACHED') {
        setAlertMessage(
          chatError.message || 'Something went wrong. Please try again.',
        );
        posthog?.capture('chat_error_occurred', {
          channel_id: channelSchema.id,
          org_id: orgId,
          agent_id: channelSchema.agentId,
          error_code: chatError.code,
          error_message: chatError.message,
        });
      }
    },
  });

  const handleStartCall = () => {
    const convId = crypto.randomUUID();
    setVoiceConversationId(convId);
    setIsCallActive(true);
    posthog?.capture('voice_call_started', {
      channel_id: channelSchema.id,
      org_id: orgId,
      agent_id: channelSchema.agentId,
    });
  };

  const handleCallClose = () => {
    setIsCallActive(false);
    posthog?.capture('voice_call_ended', {
      channel_id: channelSchema.id,
      org_id: orgId,
      agent_id: channelSchema.agentId,
    });
  };

  const voiceWsUrl = voiceConversationId
    ? buildVoiceWsUrl(import.meta.env.VITE_API_BASE, channelSchema.id, orgId, voiceConversationId)
    : '';

  return (
    <div className="relative h-full">
      <Agent
        displayName={channelConfig.displayName}
        primaryColor={channelConfig.primaryColor}
        inputPlaceholder={channelConfig.inputPlaceholder}
        subTitle={channelConfig.subtitle}
        className="h-full"
        isLoading={status === 'submitted'}
        inputDisabled={isUsageExhausted}
        alertMessage={alertMessage}
        voiceEnabled={channelConfig.voiceEnabled}
        onStartCall={handleStartCall}
        messages={messages.map((value) => ({
          id: value.id,
          message: value.parts.find((v) => v?.type === 'text')?.text || '',
          type: value.role === 'user' ? 'user' : 'system',
        }))}
        onSendMessage={(message) => {
          posthog?.capture('chat_message_sent', {
            channel_id: channelSchema.id,
            org_id: orgId,
            agent_id: channelSchema.agentId,
            message_count: messages.length,
          });
          sendMessage({ text: message });
        }}
        onNewChat={() => {
          posthog?.capture('chat_new_session_started', {
            channel_id: channelSchema.id,
            org_id: orgId,
            agent_id: channelSchema.agentId,
            messages_in_previous_session: messages.length,
          });
          onNewChat();
        }}
        onClose={() => {
          posthog?.capture('chat_widget_closed', {
            channel_id: channelSchema.id,
            org_id: orgId,
            agent_id: channelSchema.agentId,
            message_count: messages.length,
          });
          window.parent.postMessage({ type: 'KB_CLOSE_CHAT' }, '*');
        }}
        brandLink={import.meta.env.VITE_APP_URL}
      />
      {isCallActive && voiceWsUrl && (
        <VoiceCall
          wsUrl={voiceWsUrl}
          agentName={channelConfig.displayName}
          primaryColor={channelConfig.primaryColor}
          onClose={handleCallClose}
        />
      )}
    </div>
  );
};

export const AgentWidget = ({ channelSchema, orgId }: IAgentWidgetProps) => {
  const [chatKey, setChatKey] = useState(0);

  return (
    <AgentWidgetContent
      key={chatKey}
      channelSchema={channelSchema}
      orgId={orgId}
      onNewChat={() => setChatKey((k) => k + 1)}
    />
  );
};
