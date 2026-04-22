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
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { ArchiveAgentDialog } from '@/components/ArchiveAgentDialog/ArchiveAgentDialog.tsx';
import { patchAgentsById } from '@/services';
import {
  AGENT_LIMIT_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { getErrorMessage } from '@/utils/errorHelper.ts';

export const AgentMenuActions = ({
  agentStatus,
  agentName,
  disableUnarchive = false,
  disableUnarchiveReason = AGENT_LIMIT_TOOLTIP,
}: {
  agentStatus: 'active' | 'archived';
  agentName?: string;
  disableUnarchive?: boolean;
  disableUnarchiveReason?: string;
}) => {
  const posthog = usePostHog();
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!agentId) {
        throw new Error('agentId not available');
      }

      return patchAgentsById({
        path: { id: agentId },
        body: {
          agentStatus: agentStatus === 'archived' ? 'active' : 'archived',
        },
      });
    },
    onSuccess: () => {
      if (agentStatus === 'active') {
        posthog.capture('agent_archived', { agent_id: agentId });
      } else {
        posthog.capture('agent_unarchived', { agent_id: agentId });
      }
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
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
                {agentStatus === 'active' ? (
                  <Archive className="h-4 w-4" />
                ) : (
                  <ArchiveRestore className="h-4 w-4" />
                )}
                {agentStatus === 'active' ? 'Archive' : 'Unarchive'}
              </DropdownMenuItem>
            </div>
          </DisabledTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <ArchiveAgentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        agentName={agentName}
        currentStatus={agentStatus}
        isPending={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
    </>
  );
};
