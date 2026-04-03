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
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
} from 'lucide-react';
import { patchChatbotsById } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper.ts';

export const ChatbotMenuActions = ({
  chatbotStatus,
  disableUnarchive = false,
}: {
  chatbotStatus: 'active' | 'archived';
  disableUnarchive?: boolean;
}) => {
  const { chatbotId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!chatbotId) {
        throw new Error('ChatbotId not available');
      }

      return patchChatbotsById({
        path: { id: chatbotId },
        body: {
          chatbotStatus:
            chatbotStatus === 'archived' ? 'active' : 'archived',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbot', chatbotId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
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
        <DropdownMenuItem
          onClick={() => archiveMutation.mutate()}
          disabled={archiveMutation.isPending || disableUnarchive}
          className="flex items-center gap-2 cursor-pointer"
        >
          {chatbotStatus === 'archived' ? (
            <ArchiveRestore className="h-4 w-4" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          {chatbotStatus === 'archived' ? 'Unarchive' : 'Archive'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
