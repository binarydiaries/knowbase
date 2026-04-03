import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@knowbase/ui/components/tooltip';
import type { PropsWithChildren } from 'react';

export const CHATBOT_LIMIT_TOOLTIP =
  'Workspace has reached its chatbot limit.';
export const CHATBOT_LOCK_TOOLTIP =
  'Workspace is over its chatbot limit.';

export function DisabledTooltip({
  children,
  content,
  disabled,
}: PropsWithChildren<{
  content?: string;
  disabled?: boolean;
}>) {
  if (!disabled || !content) {
    return children;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
