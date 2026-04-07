import { Button } from '@knowbase/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Loader2 } from 'lucide-react';

export function ArchiveChatbotDialog({
  open,
  onOpenChange,
  chatbotName,
  currentStatus,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotName?: string;
  currentStatus: 'active' | 'archived';
  isPending: boolean;
  onConfirm: () => void;
}) {
  const isArchiving = currentStatus === 'active';
  const subject = chatbotName ? `"${chatbotName}"` : 'This chatbot';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isArchiving ? 'Archive chatbot?' : 'Unarchive chatbot?'}
          </DialogTitle>
          <DialogDescription>
            {isArchiving
              ? `${subject} will be archived and hidden from active use. You can unarchive it later.`
              : `${subject} will be restored and made active again.`}
          </DialogDescription>
        </DialogHeader>
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
            disabled={isPending}
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
