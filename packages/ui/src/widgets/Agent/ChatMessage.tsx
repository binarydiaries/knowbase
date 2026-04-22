import { cn } from '@knowbase/ui/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';

interface IChatMessageProps {
  systemTitle: string;
  type: 'user' | 'system';
  message: string;
  primaryColor: string;
}
export const ChatMessage = ({
  type,
  message,
  systemTitle,
  primaryColor,
}: IChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={cn('flex', type === 'user' ? 'justify-end' : '')}>
      <div
        className={cn(
          'max-w-3/4 flex flex-col rounded-2xl p-4 gap-1 group relative',
          type === 'system' ? 'bg-muted text-foreground' : 'text-white',
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
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )}

        <Markdown
          components={{
            p: (props) => <p {...props} className="text-sm" />,
            ol: (props) => (
              <ol {...props} className="list-decimal pl-6 space-y-2" />
            ),
            ul: (props) => (
              <ul {...props} className="list-disc pl-6 space-y-2" />
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
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
