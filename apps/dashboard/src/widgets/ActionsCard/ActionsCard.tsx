import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { toast } from '@knowbase/ui/components/sonner';
import { Switch } from '@knowbase/ui/components/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { CalendarClock, LockIcon, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import {
  getAgentActions,
  patchAgentActionsById,
  postAgentActions,
} from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { LeadGenerationConfigDrawer } from './LeadGenerationConfigDrawer';
import { SchedulingConfigDrawer } from './SchedulingConfigDrawer';

type ActionTypeId = 'lead_generation' | 'scheduling';

const ACTION_TYPES: Array<{
  id: ActionTypeId;
  label: string;
  description: string;
  lockedDescription: string;
  icon: typeof UserRound;
}> = [
  {
    id: 'lead_generation',
    label: 'Lead Generation',
    description:
      'Capture contact info (name, email, phone) through natural conversation.',
    lockedDescription: 'Upgrade to Starter or above to enable lead generation.',
    icon: UserRound,
  },
  {
    id: 'scheduling',
    label: 'Appointment Scheduling',
    description: 'Let users book Cal.com appointments directly in chat.',
    lockedDescription:
      'Upgrade to Starter or above to enable appointment scheduling.',
    icon: CalendarClock,
  },
];

const ActionsCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  if (!agentId) throw new Error('agentId not available');
  const queryClient = useQueryClient();
  const [configuringActionId, setConfiguringActionId] = useState<string | null>(
    null,
  );
  const { plan } = useClerkPlan();
  const isPaidPlan = plan !== 'free';

  const actionsQuery = useQuery({
    queryKey: ['agent-actions', agentId],
    queryFn: () => getAgentActions({ query: { agentId } }),
  });

  const actions = actionsQuery.data?.data.actions ?? [];

  const getAction = (type: ActionTypeId) =>
    actions.find((a) => a.actionType === type);

  const toggleMutation = useMutation({
    mutationFn: async ({
      type,
      enabled,
    }: {
      type: ActionTypeId;
      enabled: boolean;
    }) => {
      const existing = getAction(type);
      if (existing) {
        await patchAgentActionsById({
          path: { id: existing.id },
          body: { enabled },
        });
      } else {
        await postAgentActions({
          body: { agentId, actionType: type, config: {} },
        });
      }
    },
    onSuccess: (_, variables) => {
      const actionLabel =
        ACTION_TYPES.find((a) => a.id === variables.type)?.label ?? 'Action';
      toast.success(
        `${actionLabel} ${variables.enabled ? 'enabled' : 'disabled'}`,
      );
      queryClient.invalidateQueries({ queryKey: ['agent-actions', agentId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const configuringAction = configuringActionId
    ? getAction(configuringActionId as ActionTypeId)
    : null;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l">Actions</CardTitle>
          <CardDescription>
            Let your agent take actions beyond answering questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-0">
          {ACTION_TYPES.map((actionType, index) => {
            const action = getAction(actionType.id);
            const isEnabled = action?.enabled ?? false;
            const Icon = actionType.icon;
            const isLocked = !isPaidPlan;

            return (
              <div key={actionType.id}>
                {index > 0 && <Separator />}
                <div
                  className={`flex items-center justify-between px-6 py-4 ${isLocked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md border p-2">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {actionType.label}
                        </p>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                            <LockIcon className="size-3" />
                            Starter+
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isLocked
                          ? actionType.lockedDescription
                          : actionType.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && !isLocked && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setConfiguringActionId(actionType.id)}
                        disabled={readOnly}
                      >
                        Configure
                      </button>
                    )}
                    <Switch
                      checked={isEnabled}
                      disabled={
                        readOnly || isLocked || toggleMutation.isPending
                      }
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          type: actionType.id,
                          enabled: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {configuringAction?.actionType === 'lead_generation' && (
        <LeadGenerationConfigDrawer
          action={configuringAction}
          open={configuringActionId === 'lead_generation'}
          onClose={() => setConfiguringActionId(null)}
          onSaved={() => {
            queryClient.invalidateQueries({
              queryKey: ['agent-actions', agentId],
            });
            setConfiguringActionId(null);
          }}
        />
      )}

      {configuringAction?.actionType === 'scheduling' && (
        <SchedulingConfigDrawer
          action={configuringAction}
          open={configuringActionId === 'scheduling'}
          onClose={() => setConfiguringActionId(null)}
          onSaved={() => {
            queryClient.invalidateQueries({
              queryKey: ['agent-actions', agentId],
            });
            setConfiguringActionId(null);
          }}
        />
      )}
    </>
  );
};

export default ActionsCard;
