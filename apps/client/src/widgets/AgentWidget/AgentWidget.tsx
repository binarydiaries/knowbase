import { useChat } from '@ai-sdk/react';
import { Agent } from '@knowbase/ui/widgets/Agent/Agent';
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

  return (
    <Agent
      displayName={channelConfig.displayName}
      primaryColor={channelConfig.primaryColor}
      inputPlaceholder={channelConfig.inputPlaceholder}
      subTitle={channelConfig.subtitle}
      className="h-full"
      isLoading={status === 'submitted'}
      inputDisabled={isUsageExhausted}
      alertMessage={alertMessage}
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
      brandLink={import.meta.env.VITE_LANDING_URL}
    />
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
