import { useChat } from '@ai-sdk/react';
import { useAuth } from '@clerk/clerk-react';
import { Agent } from '@knowbase/ui/widgets/Agent/Agent';
import { useParams } from '@tanstack/react-router';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChannelSchema } from '@/services';
import { useChannels } from '@/store/useChannels.ts';
import { parseChatError } from '@/utils/chatError.ts';

interface IAgentPreviewContentProps {
  channelWeb: ChannelSchema;
  agentId: string;
  orgId: string | null | undefined;
  onNewChat: () => void;
}

const AgentPreviewContent = ({
  channelWeb,
  agentId,
  orgId,
  onNewChat,
}: IAgentPreviewContentProps) => {
  const posthog = usePostHog();
  const initialMessageId = useId();
  const sendStartTimeRef = useRef<number>(0);
  const firstTokenTimeRef = useRef<number>(0);
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();

  const channelConfig = channelWeb.additional.config;

  const initialMessage: UIMessage | undefined = channelConfig?.welcomeMessage
    ? {
        id: initialMessageId,
        role: 'system',
        parts: [{ type: 'text', text: channelConfig.welcomeMessage }],
      }
    : undefined;

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    id: conversationId,
  } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_BASE}/chat`,
      prepareSendMessagesRequest({ messages, id, body }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find((v) => v.type === 'text');
        return {
          body: {
            ...body,
            message: messageText?.text,
            conversationId: id,
            orgId,
          },
        };
      },
    }),
    onFinish({ isError }) {
      const now = Date.now();
      const latency = sendStartTimeRef.current
        ? (now - sendStartTimeRef.current) / 1000
        : undefined;
      const timeToFirstToken =
        sendStartTimeRef.current && firstTokenTimeRef.current
          ? (firstTokenTimeRef.current - sendStartTimeRef.current) / 1000
          : undefined;
      sendStartTimeRef.current = 0;
      firstTokenTimeRef.current = 0;

      posthog.capture('$ai_generation', {
        $ai_trace_id: conversationId,
        $ai_session_id: agentId,
        $ai_provider: 'custom',
        $ai_stream: true,
        $ai_latency: latency,
        $ai_time_to_first_token: timeToFirstToken,
        $ai_is_error: isError,
        $ai_span_name: 'agent_preview_chat',
        $ai_base_url: import.meta.env.VITE_API_BASE,
      });
    },
    onError(error) {
      const chatError = parseChatError(error);
      if (!chatError) return;

      if (chatError.code === 'MESSAGE_LIMIT_REACHED' && !isUsageExhausted) {
        setIsUsageExhausted(true);
        setAlertMessage(
          chatError.message ||
            'This assistant is temporarily unavailable due to the monthly message limit.',
        );
        return;
      }

      if (chatError.code && chatError.code !== 'MESSAGE_LIMIT_REACHED') {
        setAlertMessage(
          chatError.message || 'Something went wrong. Please try again.',
        );
      }
    },
  });

  // Record time of first streaming token for $ai_time_to_first_token
  useEffect(() => {
    if (
      status === 'streaming' &&
      sendStartTimeRef.current > 0 &&
      firstTokenTimeRef.current === 0
    ) {
      firstTokenTimeRef.current = Date.now();
    }
  }, [status]);

  useEffect(() => {
    if (initialMessage) {
      setMessages((existing) => {
        existing[0] = initialMessage;
        return existing;
      });
    }
  }, [setMessages, initialMessage]);

  return (
    <Agent
      displayName={channelConfig?.displayName || ''}
      subTitle={channelConfig?.subtitle}
      inputPlaceholder={channelConfig?.inputPlaceholder}
      primaryColor={channelConfig?.primaryColor || ''}
      className="max-h-175 h-full"
      isLoading={status === 'submitted'}
      inputDisabled={isUsageExhausted}
      alertMessage={alertMessage}
      messages={messages.map((value) => ({
        id: value.id,
        message: value.parts.find((v) => v?.type === 'text')?.text || '',
        type: value.role === 'user' ? 'user' : 'system',
      }))}
      onSendMessage={(message) => {
        sendStartTimeRef.current = Date.now();
        sendMessage({ text: message }, { body: { channelId: channelWeb.id } });
      }}
      onNewChat={onNewChat}
      brandLink={import.meta.env.VITE_APP_URL}
    />
  );
};

export const AgentPreview = () => {
  const { agentId } = useParams({ strict: false });
  const { orgId } = useAuth();
  const [chatKey, setChatKey] = useState(0);

  if (!agentId) {
    throw new Error('agentId not available');
  }

  const channelWeb = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );

  if (!channelWeb) {
    return null;
  }

  return (
    <AgentPreviewContent
      key={chatKey}
      channelWeb={channelWeb}
      agentId={agentId}
      orgId={orgId}
      onNewChat={() => setChatKey((k) => k + 1)}
    />
  );
};
