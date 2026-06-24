import { Switch } from '@knowbase/ui/components/switch';
import { LockIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export function ActionRow({
  icon: Icon,
  title,
  description,
  isLocked,
  lockBadgeLabel,
  isEnabled,
  isPending,
  disabled,
  showConfigure,
  onToggle,
  onConfigure,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isLocked: boolean;
  lockBadgeLabel: string;
  isEnabled: boolean;
  isPending: boolean;
  disabled: boolean;
  showConfigure: boolean;
  onToggle: (checked: boolean) => void;
  onConfigure: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 ${isLocked ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md border p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                <LockIcon className="size-3" />
                {lockBadgeLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showConfigure && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={onConfigure}
          >
            Configure
          </button>
        )}
        <Switch
          checked={isEnabled}
          disabled={disabled || isLocked || isPending}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  );
}
