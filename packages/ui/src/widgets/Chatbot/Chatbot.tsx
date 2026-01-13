import { Button } from '@knowbase/ui/components/button';
import { Textarea } from '@knowbase/ui/components/textarea';
import { cn } from '@knowbase/ui/lib/utils';
import { Ellipsis, SendHorizonal, X } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import type { IChatMessage } from './Chatbot.types';
import { ChatMessage } from './ChatMessage';
import iconSvg from './icon2.png';

interface IChatbotProps extends ComponentProps<'div'> {
  messages?: IChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  onClose?: () => void;
}

export const Chatbot = ({
  messages,
  className,
  onSendMessage,
  isLoading,
  onClose,
  ...otherProps
}: IChatbotProps) => {
  const [input, setInput] = useState('');

  const submitForm = () => {
    if (input.trim()) {
      onSendMessage?.(input);
      setInput('');
    }
  };

  return (
    <div
      className={cn(
        'w-100 shadow-[0_0_15px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col',
        className,
      )}
      {...otherProps}
    >
      <div className="flex bg-gray-950 h-18 px-5 items-center gap-5 shrink-0">
        <img src={iconSvg} alt="" className="size-10" />
        <div className="text-white flex-1">
          <h2 className="text-base font-semibold">Gini</h2>
          <p className="text-sm">Customer support assistance</p>
        </div>
        <Button size="icon-sm" onClick={onClose}>
          <X className="text-white size-5" />
        </Button>
      </div>
      <div className="flex flex-col gap-5 p-5 overflow-auto h-full">
        {messages?.map((message) => (
          <ChatMessage
            systemTitle="Siri"
            type={message.type}
            message={message.message}
            key={message.id}
          />
        ))}

        {isLoading && (
          <div className="flex">
            <div className="rounded-2xl px-4 py-2 bg-[#F0F0F0]">
              <Ellipsis />
            </div>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div className="relative">
          <Textarea
            className="min-h-12 rounded-2xl pr-14 py-3 resize-none"
            placeholder="Type your message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // prevent new line
                submitForm();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-2"
            disabled={input.trim().length === 0}
            onClick={submitForm}
          >
            <SendHorizonal className="size-6" />
          </Button>
        </div>
        <p className="text-xs text-center text-slate-300">
          Powered by <strong>Knowbase</strong>
        </p>
      </div>
    </div>
  );
};
