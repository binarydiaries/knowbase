import { cn } from '@knowbase/ui/lib/utils';

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
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};
