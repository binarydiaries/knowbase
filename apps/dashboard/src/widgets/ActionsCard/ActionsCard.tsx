import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { useParams } from '@tanstack/react-router';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ApiCallAction } from './apiCall/ApiCallAction';
import { LeadGenerationAction } from './leadCapture/LeadGenerationAction';

// ── Component ─────────────────────────────────────────────────────────────────

const ActionsCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { agentId } = useParams({ strict: false });
  if (!agentId) throw new Error('agentId not available');

  const { data: flags } = useFeatureFlags();
  const leadGenFlagEnabled = !!flags?.['lead_generation'];
  const apiCallFlagEnabled = !!flags?.['api_call_action'];

  // Hide the whole card if no action type's feature flag is on.
  // Add new action types here behind their own flag check.
  if (!leadGenFlagEnabled && !apiCallFlagEnabled) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-l">Actions</CardTitle>
        <CardDescription>
          Let your agent take actions beyond answering questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0 divide-y">
        {leadGenFlagEnabled && (
          <LeadGenerationAction agentId={agentId} readOnly={readOnly} />
        )}
        {apiCallFlagEnabled && (
          <ApiCallAction agentId={agentId} readOnly={readOnly} />
        )}
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
