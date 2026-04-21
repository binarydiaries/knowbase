import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@knowbase/ui/components/tooltip';
import type { PropsWithChildren } from 'react';

export const AGENT_LIMIT_TOOLTIP =
  'Workspace has reached its agent limit.';
export const AGENT_LOCK_TOOLTIP =
  'Workspace is over its agent limit.';
export const KNOWLEDGE_SOURCE_LIMIT_TOOLTIP =
  'Workspace has reached its knowledge source limit.';
export const TRAINING_LIMIT_TOOLTIP =
  'Workspace has reached its daily training limit.';
export const NO_READY_TRAINING_TOOLTIP =
  'No knowledge sources are ready to train.';

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
