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
import { deleteWorkflowsById, getWorkflows, postWorkflows } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { LeadGenerationDrawer } from './LeadGenerationDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkflowRow = {
  id: string;
  name: string;
  intentName: string;
  requiredFields: string[];
  config: { success?: string; failure?: string } | null;
  actions: { actionType: string }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_INTENT = 'user wants to provide contact information or be contacted';
const DEFAULT_SUCCESS = "Thanks! We'll be in touch.";

// ── Component ─────────────────────────────────────────────────────────────────

const WorkflowsCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  if (!agentId) throw new Error('agentId not available');

  const queryClient = useQueryClient();
  const { plan } = useClerkPlan();
  const isLocked = plan === 'free';

  const [drawerOpen, setDrawerOpen] = useState(false);

  const workflowsQuery = useQuery({
    queryKey: ['workflows', agentId],
    queryFn: () => getWorkflows({ query: { agentId } }),
  });

  const workflows: WorkflowRow[] = (workflowsQuery.data?.data.workflows ?? []) as WorkflowRow[];
  const leadGenWorkflow = workflows.find((w) =>
    w.actions.some((a) => a.actionType === 'save_lead'),
  ) ?? null;

  const isEnabled = leadGenWorkflow !== null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['workflows', agentId] });

  // Enable: create default lead gen workflow
  const enableMutation = useMutation({
    mutationFn: () =>
      postWorkflows({
        body: {
          agentId,
          name: 'Lead Generation',
          intentName: DEFAULT_INTENT,
          requiredFields: ['name', 'email'],
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

  // Disable: delete the workflow
  const disableMutation = useMutation({
    mutationFn: () =>
      deleteWorkflowsById({ path: { id: leadGenWorkflow!.id } }),
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
    workflowsQuery.isLoading;

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

      <LeadGenerationDrawer
        agentId={agentId}
        workflow={leadGenWorkflow}
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

export default WorkflowsCard;
