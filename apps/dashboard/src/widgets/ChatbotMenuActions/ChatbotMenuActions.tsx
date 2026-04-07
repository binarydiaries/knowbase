import { Button } from '@knowbase/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Archive, ArchiveRestore, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { ArchiveChatbotDialog } from '@/components/ArchiveChatbotDialog/ArchiveChatbotDialog.tsx';
import { patchChatbotsById } from '@/services';
import {
  CHATBOT_LIMIT_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { getErrorMessage } from '@/utils/errorHelper.ts';

export const ChatbotMenuActions = ({
  chatbotStatus,
  disableUnarchive = false,
  disableUnarchiveReason = CHATBOT_LIMIT_TOOLTIP,
}: {
  chatbotStatus: 'active' | 'archived';
  disableUnarchive?: boolean;
  disableUnarchiveReason?: string;
}) => {
  const { chatbotId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!chatbotId) {
        throw new Error('ChatbotId not available');
      }

      return patchChatbotsById({
        path: { id: chatbotId },
        body: {
          chatbotStatus: chatbotStatus === 'archived' ? 'active' : 'archived',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot', chatbotId] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setConfirmOpen(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-accent h-7 w-7"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DisabledTooltip
            disabled={disableUnarchive}
            content={disableUnarchiveReason}
          >
            <div>
              <DropdownMenuItem
                onClick={() => setConfirmOpen(true)}
                disabled={archiveMutation.isPending || disableUnarchive}
                className="flex items-center gap-2 cursor-pointer"
              >
                {chatbotStatus === 'active' ? (
                  <Archive className="h-4 w-4" />
                ) : (
                  <ArchiveRestore className="h-4 w-4" />
                )}
                {chatbotStatus === 'active' ? 'Archive' : 'Unarchive'}
              </DropdownMenuItem>
            </div>
          </DisabledTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveChatbotDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        currentStatus={chatbotStatus}
        isPending={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
    </>
  );
};
