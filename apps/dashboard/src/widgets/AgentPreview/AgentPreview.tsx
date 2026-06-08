import { useChat } from '@ai-sdk/react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@knowbase/ui/components/button';
import { Agent } from '@knowbase/ui/widgets/Agent/Agent';
import { useParams } from '@tanstack/react-router';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useId, useMemo, useState } from 'react';
import type { ChannelSchema } from '@/services';
import { useChannels } from '@/store/useChannels.ts';
import { parseChatError } from '@/utils/chatError.ts';

type ChatVersion = 'v1' | 'v2';

interface IAgentPreviewContentProps {
  channelWeb: ChannelSchema;
  onNewChat: () => void;
  version: ChatVersion;
}

const AgentPreviewContent = ({
  channelWeb,
  onNewChat,
  version,
}: IAgentPreviewContentProps) => {
  const { getToken } = useAuth();
  const initialMessageId = useId();
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();

  const channelConfig = useMemo(() => {
    const channelAdditional = channelWeb.additional;
    if (channelAdditional.type !== 'web') return null;
    return channelAdditional.config;
  }, [channelWeb.additional]);

  const initialMessage: UIMessage | undefined = channelConfig?.welcomeMessage
    ? {
        id: initialMessageId,
        role: 'system',
        parts: [{ type: 'text', text: channelConfig.welcomeMessage }],
      }
    : undefined;

  const previewApi = version === 'v2'
    ? `${import.meta.env.VITE_API_BASE}/chatv2/preview`
    : `${import.meta.env.VITE_API_BASE}/chat/preview`;

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: previewApi,
      fetch: async (url, init) => {
        const token = await getToken();
        return fetch(url, {
          ...init,
          headers: {
            ...(init?.headers as Record<string, string>),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      },
      prepareSendMessagesRequest({ messages, id, body }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find((v) => v.type === 'text');
        return {
          body: {
            ...body,
            message: messageText?.text,
            conversationId: id,
          },
        };
      },
    }),
    onError(error) {
      const chatError = parseChatError(error);

      if (chatError?.code === 'MESSAGE_LIMIT_REACHED' && !isUsageExhausted) {
        setIsUsageExhausted(true);
        setAlertMessage(
          chatError.message ||
            'This assistant is temporarily unavailable due to the monthly message limit.',
        );
        return;
      }

      setAlertMessage(
        chatError?.message || 'Something went wrong. Please try again.',
      );
    },
  });

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
      messages={messages
        .filter((m) => {
          const text = m.parts.find((p) => p.type === 'text')?.text;
          return typeof text === 'string' && text.trim().length > 0;
        })
        .map((value) => ({
          id: value.id,
          message: value.parts.find((v) => v?.type === 'text')?.text ?? '',
          type: value.role === 'user' ? 'user' : 'system',
        }))}
      onSendMessage={(message) => {
        sendMessage({ text: message }, { body: { channelId: channelWeb.id } });
      }}
      onNewChat={onNewChat}
      brandLink={import.meta.env.VITE_LANDING_URL}
      suggestionQuestions={channelConfig?.suggestionQuestions}
      avatarUrl={channelConfig?.avatarUrl}
    />
  );
};

export const AgentPreview = () => {
  const { agentId } = useParams({ strict: false });
  const [chatKey, setChatKey] = useState(0);
  const [version, setVersion] = useState<ChatVersion>('v1');

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
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0">
        <span className="text-xs text-muted-foreground mr-2">Version</span>
        <Button
          size="xs"
          variant={version === 'v1' ? 'default' : 'outline'}
          onClick={() => {
            setVersion('v1');
            setChatKey((k) => k + 1);
          }}
        >
          V1
        </Button>
        <Button
          size="xs"
          variant={version === 'v2' ? 'default' : 'outline'}
          onClick={() => {
            setVersion('v2');
            setChatKey((k) => k + 1);
          }}
        >
          V2
        </Button>
      </div>
      <AgentPreviewContent
        key={chatKey}
        channelWeb={channelWeb}
        version={version}
        onNewChat={() => setChatKey((k) => k + 1)}
      />
    </div>
  );
};
