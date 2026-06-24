import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Webhook } from 'lucide-react';
import { useState } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import { deleteIntentsById, getIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { ActionRow } from '../ActionRow';
import type { IntentRow } from '../types';
import { ApiCallDrawer } from './ApiCallDrawer';

export function ApiCallAction({
  agentId,
  readOnly,
}: {
  agentId: string;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const { plan } = useClerkPlan();
  const isLocked = plan === 'free';

  const [drawerOpen, setDrawerOpen] = useState(false);

  const intentsQuery = useQuery({
    queryKey: ['intents', agentId],
    queryFn: () => getIntents({ query: { agentId } }),
  });

  const intents: IntentRow[] = (intentsQuery.data?.data.intents ??
    []) as IntentRow[];
  const apiCallIntent =
    intents.find((w) =>
      w.actions.some((a) => a.actionType === 'api_trigger'),
    ) ?? null;
  const isEnabled = apiCallIntent !== null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['intents', agentId] });

  // Disable: delete the intent
  const disableMutation = useMutation({
    mutationFn: () => deleteIntentsById({ path: { id: apiCallIntent!.id } }),
    onSuccess: () => {
      toast.success('API call action disabled.');
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // No sane default URL/instructions exist — always configure before enabling.
      setDrawerOpen(true);
    } else {
      disableMutation.mutate();
    }
  };

  const isPending = disableMutation.isPending || intentsQuery.isLoading;

  return (
    <>
      <ActionRow
        icon={Webhook}
        title="API Call Action"
        description={
          isLocked
            ? 'Upgrade to Starter or above to call your API for live data (e.g. order tracking).'
            : 'Call your API for live data, like order status, and answer with the real result.'
        }
        isLocked={isLocked}
        lockBadgeLabel="Starter+"
        isEnabled={isEnabled}
        isPending={isPending}
        disabled={readOnly}
        showConfigure={isEnabled && !isLocked && !readOnly}
        onToggle={handleToggle}
        onConfigure={() => setDrawerOpen(true)}
      />

      <ApiCallDrawer
        agentId={agentId}
        intent={apiCallIntent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          invalidate();
        }}
      />
    </>
  );
}
