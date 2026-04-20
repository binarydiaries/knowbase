import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { Switch } from '@knowbase/ui/components/switch';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import {
  getChatbotActions,
  postChatbotActions,
  patchChatbotActionsById,
} from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { LeadGenerationConfigDrawer } from './LeadGenerationConfigDrawer';

const ACTION_TYPES = [
  {
    id: 'lead_generation' as const,
    label: 'Lead Generation',
    description: 'Capture contact info (name, email, phone) through natural conversation.',
    icon: UserRound,
  },
];

const ActionsCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { chatbotId } = useParams({ strict: false });
  if (!chatbotId) throw new Error('ChatbotId not available');
  const queryClient = useQueryClient();
  const [configuringActionId, setConfiguringActionId] = useState<string | null>(null);

  const actionsQuery = useQuery({
    queryKey: ['chatbot-actions', chatbotId],
    queryFn: () => getChatbotActions({ query: { chatbotId } }),
  });

  const actions = actionsQuery.data?.data.actions ?? [];

  const getAction = (type: 'lead_generation') =>
    actions.find((a) => a.actionType === type);

  const toggleMutation = useMutation({
    mutationFn: async ({
      type,
      enabled,
    }: {
      type: 'lead_generation';
      enabled: boolean;
    }) => {
      const existing = getAction(type);
      if (existing) {
        await patchChatbotActionsById({
          path: { id: existing.id },
          body: { enabled },
        });
      } else {
        await postChatbotActions({
          body: { chatbotId, actionType: type, config: {} },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-actions', chatbotId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const configuredAction = configuringActionId
    ? getAction(configuringActionId as 'lead_generation')
    : null;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-l">Actions</CardTitle>
          <CardDescription>
            Let your chatbot take actions beyond answering questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-0">
          {ACTION_TYPES.map((actionType, index) => {
            const action = getAction(actionType.id);
            const isEnabled = action?.enabled ?? false;
            const Icon = actionType.icon;

            return (
              <div key={actionType.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md border p-2">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{actionType.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {actionType.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && (
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
                      disabled={readOnly || toggleMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ type: actionType.id, enabled: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {configuredAction && (
        <LeadGenerationConfigDrawer
          action={configuredAction}
          open={configuringActionId === 'lead_generation'}
          onClose={() => setConfiguringActionId(null)}
          onSaved={() => {
            queryClient.invalidateQueries({
              queryKey: ['chatbot-actions', chatbotId],
            });
            setConfiguringActionId(null);
          }}
        />
      )}
    </>
  );
};

export default ActionsCard;
