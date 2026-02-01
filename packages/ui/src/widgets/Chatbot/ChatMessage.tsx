import { cn } from '@knowbase/ui/lib/utils';
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
  return (
    <div className={cn('flex', type === 'user' ? 'justify-end' : '')}>
      <div
        className={cn(
          'max-w-3/4 flex flex-col rounded-2xl p-4 gap-1',
          type === 'system' ? '' : 'text-white',
        )}
        style={{
          backgroundColor: type === 'system' ? '#F0F0F0' : primaryColor,
        }}
      >
        {type === 'system' && (
          <h4 className="text-sm font-medium">{systemTitle}</h4>
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
          }}
        >
          {message}
        </Markdown>
      </div>
    </div>
  );
};
