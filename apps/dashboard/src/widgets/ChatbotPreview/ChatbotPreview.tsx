import { useChat } from '@ai-sdk/react';
import { useAuth } from '@clerk/clerk-react';
import { Chatbot } from '@knowbase/ui/widgets/Chatbot/Chatbot';
import { useParams } from '@tanstack/react-router';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useId, useState } from 'react';
import { useChannels } from '@/store/useChannels.ts';
import { parseChatError } from '@/utils/chatError.ts';

export const ChatbotPreview = () => {
  const { chatbotId } = useParams({ strict: false });
  const { orgId } = useAuth();
  const initialMessageId = useId();
  const [isUsageExhausted, setIsUsageExhausted] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>();
  if (!chatbotId) {
    throw new Error('ChatbotId not available');
  }

  const channelWeb = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );
  const channelConfig = channelWeb?.additional.config;

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

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: initialMessage ? [initialMessage] : [],
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_BASE}/chat`,
      prepareSendMessagesRequest({ messages, id, body }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find(
          (value) => value.type === 'text',
        );
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
        setAlertMessage(chatError.message || 'Something went wrong. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (initialMessage) {
      setMessages((exisingMessages) => {
        exisingMessages[0] = initialMessage;
        return exisingMessages;
      });
    }
  }, [setMessages, initialMessage]);

  if (!channelWeb) {
    return null;
  }

  return (
    <Chatbot
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
        message:
          value.parts.find((value1) => value1?.type === 'text')?.text || '',
        type: value.role === 'user' ? 'user' : 'system',
      }))}
      onSendMessage={(message) =>
        sendMessage({ text: message }, { body: { channelId: channelWeb?.id } })
      }
    />
  );
};
