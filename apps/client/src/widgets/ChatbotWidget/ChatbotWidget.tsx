import { useChat } from '@ai-sdk/react';
import { Chatbot } from '@knowbase/ui/widgets/Chatbot/Chatbot';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useId, useState } from 'react';
import { baseUrl } from '@/services/chat.ts';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';
import { parseChatError } from '@/utils/chatError.ts';

interface IChatbotWidgetProps {
  channelSchema: ChannelSchema;
  orgId: string;
}

export const ChatbotWidget = ({
  channelSchema,
  orgId,
}: IChatbotWidgetProps) => {
  const channelConfig = channelSchema.additional.config;
  const initialMessageId = useId();
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();

  const initialMessage: UIMessage | undefined = channelConfig?.welcomeMessage
    ? {
        id: initialMessageId,
        role: 'system',
        parts: [
          {
            type: 'text',
            text: channelConfig.welcomeMessage,
          },
        ],
      }
    : undefined;

  const { messages, sendMessage, status } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: baseUrl,
      prepareSendMessagesRequest({ messages, id }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find(
          (value) => value.type === 'text',
        );
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
      if (chatError?.code !== 'MESSAGE_LIMIT_REACHED' || isUsageExhausted) {
        return;
      }

      setIsUsageExhausted(true);
      setAlertMessage(
        'This assistant is temporarily unavailable right now. Please try again later.',
      );
    },
  });
  return (
    <Chatbot
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
        message:
          value.parts.find((value1) => value1?.type === 'text')?.text || '',
        type: value.role === 'user' ? 'user' : 'system',
      }))}
      onSendMessage={(message) => sendMessage({ text: message })}
      onClose={() => {
        window.parent.postMessage({ type: 'KB_CLOSE_CHAT' }, '*');
      }}
    />
  );
};
