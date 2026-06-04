import { useChat } from '@ai-sdk/react';
import { useAuth } from '@clerk/clerk-react';
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
  version: ChatVersion;
  onNewChat: () => void;
}

const AgentPreviewContent = ({
  channelWeb,
  version,
  onNewChat,
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

  const apiUrl =
    version === 'v1'
      ? `${import.meta.env.VITE_API_BASE}/chat/preview`
      : `${import.meta.env.VITE_API_BASE}/v2/chat/preview`;

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: apiUrl,
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
      messages={messages.map((value) => ({
        id: value.id,
        message: value.parts.find((v) => v?.type === 'text')?.text || '',
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

  if (!agentId) throw new Error('agentId not available');

  const channelWeb = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );

  if (!channelWeb) return null;

  const handleVersionChange = (v: ChatVersion) => {
    setVersion(v);
    setChatKey((k) => k + 1); // reset chat on version switch
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-1 self-end">
        {(['v1', 'v2'] as ChatVersion[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleVersionChange(v)}
            className={[
              'px-3 py-1 rounded-md text-xs font-semibold transition-colors',
              version === v
                ? 'bg-[#301B69] text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      <AgentPreviewContent
        key={`${chatKey}-${version}`}
        channelWeb={channelWeb}
        version={version}
        onNewChat={() => setChatKey((k) => k + 1)}
      />
    </div>
  );
};
