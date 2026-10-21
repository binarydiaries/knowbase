import { useChat } from '@ai-sdk/react';
import { Agent } from '@knowbase/ui/widgets/Agent/Agent';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useId, useRef, useState } from 'react';
import { baseUrl } from '@/services/chat.ts';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';
import { parseChatError } from '@/utils/chatError.ts';

interface IAgentWidgetProps {
  channelSchema: ChannelSchema;
  parentOrigin?: string;
}

interface IAgentWidgetContentProps extends IAgentWidgetProps {
  onNewChat: () => void;
}

const AgentWidgetContent = ({
  channelSchema,
  parentOrigin,
  onNewChat,
}: IAgentWidgetContentProps) => {
  const channelConfig = channelSchema.additional.config;
  const initialMessageId = useId();
  const session = useRef<Promise<string> | null>(null);
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();

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
      async prepareSendMessagesRequest({ messages }) {
        if (!session.current) {
          session.current = fetch(`${baseUrl}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: channelSchema.id, parentOrigin }),
          })
            .then(async (response) => {
              if (!response.ok)
                throw new Error('Unable to start this conversation.');
              return (await response.json()).conversationToken as string;
            })
            .catch((error) => {
              session.current = null;
              throw error;
            });
        }
        const conversationToken = await session.current;
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find((v) => v.type === 'text');
        return {
          body: {
            message: messageText?.text,
            conversationToken,
            channelId: channelSchema?.id,
            ...(parentOrigin ? { parentOrigin } : {}),
          },
        };
      },
    }),
    onError(error) {
      const chatError = parseChatError(error);

      if (chatError?.code === 'MESSAGE_LIMIT_REACHED' && !isUsageExhausted) {
        setIsUsageExhausted(true);
        setAlertMessage(
          'This assistant is temporarily unavailable right now. Please try again later.',
        );
        return;
      }

      setAlertMessage(
        chatError?.message || 'Something went wrong. Please try again.',
      );
    },
  });

  return (
    <Agent
      displayName={channelConfig.displayName}
      primaryColor={channelConfig.primaryColor}
      inputPlaceholder={channelConfig.inputPlaceholder}
      suggestionQuestions={channelConfig.suggestionQuestions}
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
        sendMessage({ text: message });
      }}
      onNewChat={() => {
        onNewChat();
      }}
      onClose={() => {
        window.parent.postMessage({ type: 'KB_CLOSE_CHAT' }, '*');
      }}
      brandLink={import.meta.env.VITE_LANDING_URL}
      avatarUrl={channelConfig.avatarUrl}
    />
  );
};

export const AgentWidget = ({
  channelSchema,
  parentOrigin,
}: IAgentWidgetProps) => {
  const [chatKey, setChatKey] = useState(0);

  return (
    <AgentWidgetContent
      key={chatKey}
      channelSchema={channelSchema}
      parentOrigin={parentOrigin}
      onNewChat={() => setChatKey((k) => k + 1)}
    />
  );
};
