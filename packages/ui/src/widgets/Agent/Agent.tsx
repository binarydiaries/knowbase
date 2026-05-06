import { Alert, AlertDescription } from '@knowbase/ui/components/alert';
import { Button } from '@knowbase/ui/components/button';
import { Textarea } from '@knowbase/ui/components/textarea';
import { cn } from '@knowbase/ui/lib/utils';
import { Ellipsis, MessageSquarePlus, SendHorizonal, X } from 'lucide-react';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import type { IChatMessage } from './Agent.types';
import { ChatMessage } from './ChatMessage';

interface IAgentProps extends ComponentProps<'div'> {
  messages?: IChatMessage[];
  onSendMessage?: (message: string) => void;
  onNewChat?: () => void;
  isLoading?: boolean;
  inputDisabled?: boolean;
  alertMessage?: string;
  onClose?: () => void;
  displayName: string;
  subTitle?: string;
  inputPlaceholder?: string;
  suggestionQuestions?: string[];
  primaryColor: string;
  brandLink: string;
}

export const Agent = ({
  messages,
  className,
  onSendMessage,
  onNewChat,
  isLoading,
  inputDisabled = false,
  alertMessage,
  onClose,
  displayName,
  subTitle,
  inputPlaceholder,
  suggestionQuestions,
  primaryColor,
  brandLink,
  ...otherProps
}: IAgentProps) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change or loading state changes.
  // Previously only scrolled while isLoading was true, missing the final
  // scroll when the response finishes and isLoading flips to false.
  useEffect(() => {
    if (messages && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Restore focus to the input after the response finishes streaming.
  useEffect(() => {
    if (!isLoading && !inputDisabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, inputDisabled]);

  const submitForm = () => {
    if (input.trim() && !isLoading && !inputDisabled) {
      onSendMessage?.(input);
      setInput('');
    }
  };

  const isEmpty = !messages || messages.length === 0;
  const showSuggestions =
    !isLoading && !inputDisabled && (suggestionQuestions?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        'w-100 shadow-[0_0_15px_rgba(0,0,0,0.15)] dark:shadow-none border border-border rounded-3xl overflow-hidden flex flex-col',
        className,
      )}
      {...otherProps}
    >
      <div
        className="flex h-18 px-5 items-center gap-5 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <svg
          width="27"
          height="27"
          viewBox="0 0 27 27"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Agent</title>
          <path
            d="M13.5 18.5V8.5M8.5 16V11M18.5 16V11M19.75 2.67228C17.9114 1.60871 15.7768 1 13.5 1C6.59644 1 1 6.59644 1 13.5C1 15.4996 1.46952 17.3895 2.30432 19.0656C2.52617 19.511 2.60001 20.0201 2.4714 20.5007L1.72689 23.2834C1.40369 24.4912 2.50876 25.5963 3.71669 25.2731L6.49924 24.5286C6.97991 24.4 7.48901 24.4739 7.93441 24.6956C9.61046 25.5305 11.5004 26 13.5 26C20.4035 26 26 20.4035 26 13.5C26 11.2232 25.3913 9.08859 24.3278 7.25"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="text-white flex-1">
          <h2 className="text-base font-semibold">{displayName}</h2>
          {subTitle && <p className="text-sm">{subTitle}</p>}
        </div>
        {onNewChat && (
          <Button
            size="icon-sm"
            variant="link"
            onClick={onNewChat}
            className="cursor-pointer"
            aria-label="New chat"
          >
            <MessageSquarePlus className="text-white size-5" />
          </Button>
        )}
        {onClose && (
          <Button
            size="icon-sm"
            variant="link"
            onClick={onClose}
            className="cursor-pointer"
            aria-label="Close chat"
          >
            <X className="text-white size-5" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-5 p-5 overflow-auto h-full">
        {isEmpty && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <MessageSquarePlus className="size-10 opacity-30" />
            <p className="text-sm text-center">Ask me anything…</p>
          </div>
        ) : (
          <>
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
                <div className="rounded-2xl px-4 py-2 bg-muted">
                  <Ellipsis />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
      {showSuggestions && !(messages?.length && messages?.length > 1) ? (
        <div className="flex flex-wrap gap-2 p-5 pb-0 justify-end">
          {suggestionQuestions?.map((question) => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => onSendMessage?.(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="p-5 flex flex-col gap-2">
        {alertMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        ) : null}
        <div className="rounded-2xl border border-input overflow-hidden">
          <div className="px-4 py-1 text-xs text-muted-foreground border-b border-border bg-muted/50">
            AI can make mistakes. Please verify responses.
          </div>
          <div className="relative">
            <Textarea
              ref={inputRef}
              className="min-h-12 rounded-none border-0 shadow-none focus-visible:ring-0 pr-14 py-3 resize-none placeholder:truncate"
              placeholder={inputPlaceholder || 'Type your message...'}
              value={input}
              disabled={inputDisabled || isLoading}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitForm();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-2"
              disabled={inputDisabled || isLoading || input.trim().length === 0}
              onClick={submitForm}
              aria-label="Send message"
            >
              <SendHorizonal className="size-6" />
            </Button>
          </div>
        </div>
        <a
          className="text-xs text-center text-slate-300"
          href={brandLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <strong>Agenvik</strong>
        </a>
      </div>
    </div>
  );
};
