import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@knowbase/ui/components/avatar';
import { cn } from '@knowbase/ui/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';

interface IChatMessageProps {
  systemTitle: string;
  type: 'user' | 'system';
  message: string;
  primaryColor: string;
  avatarUrl?: string;
}
export const ChatMessage = ({
  type,
  message,
  systemTitle,
  primaryColor,
  avatarUrl,
}: IChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={cn(
        'flex gap-2.5 items-end',
        type === 'user' ? 'justify-end' : 'justify-start',
      )}
    >
      {type === 'system' && (
        <Avatar className="size-7 border border-border shrink-0">
          {avatarUrl ? (
            <AvatarImage
              src={avatarUrl}
              alt={systemTitle}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-muted text-[10px] font-semibold uppercase text-muted-foreground flex items-center justify-center">
            {systemTitle.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] flex flex-col rounded-2xl p-4 gap-1 group relative',
          type === 'system'
            ? 'bg-muted text-foreground rounded-bl-none'
            : 'text-white rounded-br-none',
        )}
        style={type === 'user' ? { backgroundColor: primaryColor } : undefined}
      >
        {type === 'system' && (
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">{systemTitle}</h4>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy message"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        )}

        <Markdown
          components={{
            p: (props) => <p {...props} className="text-sm" />,
            ol: (props) => (
              <ol {...props} className="list-decimal pl-6 space-y-1 text-sm" />
            ),
            ul: (props) => (
              <ul {...props} className="list-disc pl-6 space-y-1 text-sm" />
            ),
            li: (props) => <li {...props} className="text-sm" />,
            h1: (props) => <h1 {...props} className="text-sm font-semibold" />,
            h2: (props) => <h2 {...props} className="text-sm font-semibold" />,
            h3: (props) => <h3 {...props} className="text-sm font-semibold" />,
            strong: (props) => (
              <strong {...props} className="text-sm font-semibold" />
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {message}
        </Markdown>
      </div>
    </div>
  );
};
