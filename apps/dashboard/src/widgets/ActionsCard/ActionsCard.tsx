import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Switch } from '@knowbase/ui/components/switch';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { LockIcon, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useClerkPlan } from '@/hooks/useClerkPlan';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { deleteIntentsById, getIntents, postIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { DEFAULT_SUCCESS, DEFAULT_TRIGGER, LEAD_GENERATION_INTENT } from './leadCapture/constants';
import { LeadCaptureDrawer } from './leadCapture/LeadCaptureDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type IntentRow = {
  id: string;
  name: string;
  triggerInstructions: string;
  requiredFields: string[];
  optionalFields: string[];
  config: { success?: string; failure?: string } | null;
  actions: { actionType: string }[];
};

// ── Component ─────────────────────────────────────────────────────────────────

const ActionsCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  if (!agentId) throw new Error('agentId not available');

  const queryClient = useQueryClient();
  const { plan } = useClerkPlan();
  const isLocked = plan === 'free';
  const { data: flags } = useFeatureFlags();
  const leadGenFlagEnabled = !!flags?.['lead_generation'];

  const [drawerOpen, setDrawerOpen] = useState(false);

  const intentsQuery = useQuery({
    queryKey: ['intents', agentId],
    queryFn: () => getIntents({ query: { agentId } }),
  });

  const intents: IntentRow[] = (intentsQuery.data?.data.intents ?? []) as IntentRow[];
  const leadGenIntent = intents.find((w) =>
    w.actions.some((a) => a.actionType === 'save_lead'),
  ) ?? null;

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
    mutationFn: () =>
      deleteIntentsById({ path: { id: leadGenIntent!.id } }),
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

  // Hide the entire card if the lead_generation feature flag is off
  if (!leadGenFlagEnabled) return null;

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
          {/* Lead Generation row */}
          <div
            className={`flex items-center justify-between px-6 py-4 ${isLocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-md border p-2">
                <UserRound className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Lead Generation</p>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                      <LockIcon className="size-3" />
                      Starter+
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLocked
                    ? 'Upgrade to Starter or above to enable lead generation.'
                    : 'Capture contact info (name, email, phone) through natural conversation.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEnabled && !isLocked && !readOnly && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setDrawerOpen(true)}
                >
                  Configure
                </button>
              )}
              <Switch
                checked={isEnabled}
                disabled={readOnly || isLocked || isPending}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>

          {/* Divider placeholder — more action types can be added below */}
          {/* <Separator /> */}
        </CardContent>
      </Card>

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
};

export default ActionsCard;
