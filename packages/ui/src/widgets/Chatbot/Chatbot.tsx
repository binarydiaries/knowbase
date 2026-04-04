import { Button } from '@knowbase/ui/components/button';
import { Alert, AlertDescription } from '@knowbase/ui/components/alert';
import { Textarea } from '@knowbase/ui/components/textarea';
import { cn } from '@knowbase/ui/lib/utils';
import { Ellipsis, SendHorizonal, X } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import type { IChatMessage } from './Chatbot.types';
import { ChatMessage } from './ChatMessage';

interface IChatbotProps extends ComponentProps<'div'> {
  messages?: IChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  inputDisabled?: boolean;
  alertMessage?: string;
  onClose?: () => void;
  displayName: string;
  subTitle?: string;
  inputPlaceholder?: string;
  primaryColor: string;
}

export const Chatbot = ({
  messages,
  className,
  onSendMessage,
  isLoading,
  inputDisabled = false,
  alertMessage,
  onClose,
  displayName,
  subTitle,
  inputPlaceholder,
  primaryColor,
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
      <div
        className="flex h-18 px-5 items-center gap-5 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        {/** biome-ignore lint/a11y/noSvgWithoutTitle: This is svg icon */}
        <svg
          width="27"
          height="27"
          viewBox="0 0 27 27"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.5 18.5V8.5M8.5 16V11M18.5 16V11M19.75 2.67228C17.9114 1.60871 15.7768 1 13.5 1C6.59644 1 1 6.59644 1 13.5C1 15.4996 1.46952 17.3895 2.30432 19.0656C2.52617 19.511 2.60001 20.0201 2.4714 20.5007L1.72689 23.2834C1.40369 24.4912 2.50876 25.5963 3.71669 25.2731L6.49924 24.5286C6.97991 24.4 7.48901 24.4739 7.93441 24.6956C9.61046 25.5305 11.5004 26 13.5 26C20.4035 26 26 20.4035 26 13.5C26 11.2232 25.3913 9.08859 24.3278 7.25"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>

        <div className="text-white flex-1">
          <h2 className="text-base font-semibold">{displayName}</h2>
          {subTitle && <p className="text-sm">{subTitle}</p>}
        </div>
        {onClose && (
          <Button
            size="icon-sm"
            variant="link"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="text-white size-5" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-5 p-5 overflow-auto h-full">
        {messages?.map((message) => (
          <ChatMessage
            systemTitle={displayName}
            type={message.type}
            message={message.message}
            key={message.id}
            primaryColor={primaryColor}
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
        {alertMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        ) : null}
        <div className="relative">
          <Textarea
            className="min-h-12 rounded-2xl pr-14 py-3 resize-none placeholder:truncate"
            placeholder={inputPlaceholder || 'Type your message...'}
            value={input}
            disabled={inputDisabled}
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
            disabled={inputDisabled || input.trim().length === 0}
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
