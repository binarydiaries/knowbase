import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import { Check, Copy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ArchiveAgentDialog({
  open,
  onOpenChange,
  agentName,
  currentStatus,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName?: string;
  currentStatus: 'active' | 'archived';
  isPending: boolean;
  onConfirm: () => void;
}) {
  const isArchiving = currentStatus === 'active';
  const subject = agentName ? `"${agentName}"` : 'This agent';
  const [confirmInput, setConfirmInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setConfirmInput('');
  }, [open]);

  function copyAgentName() {
    if (!agentName) return;
    navigator.clipboard.writeText(agentName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const canConfirm =
    !isArchiving || !agentName || confirmInput.trim() === agentName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isArchiving ? 'Archive agent?' : 'Unarchive agent?'}
          </DialogTitle>
          <DialogDescription>
            {isArchiving
              ? `${subject} will be archived and hidden from active use. You can unarchive it later.`
              : `${subject} will be restored and made active again.`}
          </DialogDescription>
        </DialogHeader>
        {isArchiving && agentName && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 flex-wrap">
              Type <strong>{agentName}</strong>
              <button
                type="button"
                onClick={copyAgentName}
                title="Copy to clipboard"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              to confirm
            </Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={agentName}
              autoFocus
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isArchiving ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending || !canConfirm}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isArchiving ? (
              'Archive'
            ) : (
              'Unarchive'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
