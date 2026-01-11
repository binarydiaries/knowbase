import { useChat } from '@ai-sdk/react';
import { Button } from '@knowbase/ui/components/button';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Textarea } from '@knowbase/ui/components/textarea';
import { createId } from '@paralleldrive/cuid2';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { use, useEffect, useState } from 'react';
import { useQueryParams } from '@/hooks/useQueryParams.ts';

interface IChatBoxProps {
  messagePromise: Promise<UIMessage[]>;
}

const ChatBoxWidget2 = ({ messagePromise }: IChatBoxProps) => {
  const existingMessages = use(messagePromise);

  const { params, setQueryParams } = useQueryParams();

  useEffect(() => {
    if (!params.get('id')) {
      setQueryParams((p) => p.set('id', createId()));
    }
  }, [params.get, setQueryParams]);

  const { messages, sendMessage } = useChat({
    id: params.get('id') || undefined,
    messages: existingMessages,
    transport: new DefaultChatTransport({
      api: 'http://localhost:3000/chat',
      prepareSendMessagesRequest({ messages, id }) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.parts.find(
          (value) => value.type === 'text',
        );
        return {
          body: {
            message: {
              id: lastMessage.id,
              text: messageText?.text,
            },
            id,
          },
        };
      },
    }),
  });

  const submitForm = () => {
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const [input, setInput] = useState('');
  return (
    <div className="max-w-xl mx-auto h-full flex flex-col py-5">
      <div className="grow flex flex-col gap-3">
        {messages.map((message) => (
          <Item variant="outline" key={message.id}>
            <ItemContent>
              <ItemTitle>
                {' '}
                {message.role === 'user' ? 'User' : 'Assistant'}
              </ItemTitle>
              {message.parts.map((part, index) =>
                part.type === 'text' ? (
                  <ItemDescription key={+index}>{part.text}</ItemDescription>
                ) : null,
              )}
            </ItemContent>
          </Item>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
      >
        <Textarea
          placeholder="Type your message here."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // prevent new line
              submitForm();
            }
          }}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};
export default ChatBoxWidget2;
