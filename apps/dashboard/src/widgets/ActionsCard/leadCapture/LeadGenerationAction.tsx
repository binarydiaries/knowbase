import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import { deleteIntentsById, getIntents, postIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { ActionRow } from '../ActionRow';
import type { IntentRow } from '../types';
import {
  DEFAULT_SUCCESS,
  DEFAULT_TRIGGER,
  LEAD_GENERATION_INTENT,
} from './constants';
import { LeadCaptureDrawer } from './LeadCaptureDrawer';

export function LeadGenerationAction({
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
  const leadGenIntent =
    intents.find((w) => w.actions.some((a) => a.actionType === 'save_lead')) ??
    null;
  const isEnabled = leadGenIntent !== null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['intents', agentId] });

  // Enable: create default lead gen intent
  const enableMutation = useMutation({
    mutationFn: () =>
      postIntents({
        body: {
          agentId,
          name: LEAD_GENERATION_INTENT,
          triggerInstructions: DEFAULT_TRIGGER,
          requiredFields: ['name', 'email'],
          optionalFields: [],
          executionMode: 'sequential',
          config: { success: DEFAULT_SUCCESS },
          actions: [{ actionType: 'save_lead', order: 0, config: {} }],
        },
      }),
    onSuccess: () => {
      toast.success('Lead generation enabled.');
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Disable: delete the intent
  const disableMutation = useMutation({
    mutationFn: () => deleteIntentsById({ path: { id: leadGenIntent!.id } }),
    onSuccess: () => {
      toast.success('Lead generation disabled.');
      invalidate();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleToggle = (checked: boolean) => {
    if (checked) {
      enableMutation.mutate();
    } else {
      disableMutation.mutate();
    }
  };

  const isPending =
    enableMutation.isPending ||
    disableMutation.isPending ||
    intentsQuery.isLoading;

  return (
    <>
      <ActionRow
        icon={UserRound}
        title="Lead Generation"
        description={
          isLocked
            ? 'Upgrade to Starter or above to enable lead generation.'
            : 'Capture contact info (name, email, phone) through natural conversation.'
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

      <LeadCaptureDrawer
        agentId={agentId}
        intent={leadGenIntent}
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
