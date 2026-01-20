import { useChat } from '@ai-sdk/react';
import { Chatbot } from '@knowbase/ui/widgets/Chatbot/Chatbot';
import { useParams } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';

export const ChatbotPreview = () => {
  const { chatbotId } = useParams({ strict: false });
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3000/chat',
      prepareSendMessagesRequest({ messages, id }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find(
          (value) => value.type === 'text',
        );
        return {
          body: {
            message: messageText?.text,
            conversationId: id,
            chatbotId,
          },
        };
      },
    }),
  });

  return (
    <Chatbot
      className="h-full"
      isLoading={status === 'submitted'}
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
