import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormSelect } from '@/components/FormSelect/FormSelect.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchBehaviourById } from '@/services';
import { useBehaviour } from '@/store/useBehaviour.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const toneValues = ['friendly', 'professional', 'neutral'] as const;
const verbosityValues = ['short', 'balanced', 'detailed'] as const;

const behaviourTone = [
  { label: 'Friendly', value: 'friendly' },
  { label: 'Professional', value: 'professional' },
  { label: 'Neutral', value: 'neutral' },
];

const behaviorVerbosity = [
  { label: 'Short', value: 'short' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Detailed', value: 'detailed' },
];

export const chatbotBehaviourSchema = z.object({
  systemPrompt: z
    .string()
    .min(20, 'System prompt is too short')
    .max(500, 'System prompt is too long (max 500 characters)'),
  tone: z.enum(toneValues),
  verbosity: z.enum(verbosityValues),
  fallbackMessage: z
    .string()
    .min(5, 'Fallback message is too short')
    .max(120, 'Fallback message is too long (max 120 characters)'),
  guardrails: z
    .string()
    .max(300, 'Guardrails are too long (max 300 characters)')
    .optional(), // textarea, optional unless you want it required
});
type BehaviourFormValues = z.infer<typeof chatbotBehaviourSchema>;

const BehaviourCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
  const { chatbotId } = useParams({ strict: false });
  if (!chatbotId) throw new Error('ChatbotId not available');

  const behaviour = useBehaviour(
    (state) => state.behaviourByChatbotId[chatbotId],
  );

  const patchBehaviour = useBehaviour((s) => s.updateBehaviour);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<BehaviourFormValues>({
    resolver: zodResolver(chatbotBehaviourSchema),
    mode: 'all',
    defaultValues: {
      systemPrompt: behaviour.systemPrompt,
      tone: behaviour.tone,
      verbosity: behaviour.verbosity,
      fallbackMessage: behaviour.fallbackMessage,
      guardrails: behaviour.guardrails || '',
    },
  });

  const saveBehaviourMutation = useMutation({
    mutationFn: async (values: BehaviourFormValues) => {
      await patchBehaviourById({
        path: { id: behaviour.id },
        body: values,
      });

      // 🔥 instant UI update
      patchBehaviour(chatbotId, values);
    },
    onSuccess: (_, values) => {
      posthog.capture('chatbot_behaviour_saved', {
        chatbot_id: chatbotId,
        tone: values.tone,
        verbosity: values.verbosity,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSave = (values: BehaviourFormValues) => {
    saveBehaviourMutation.mutate(values);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={'text-l'}>Behaviour</CardTitle>
        <CardDescription>Chatbot behaviours</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSave)}>
        <CardContent className={'flex-col gap-5 flex'}>
          <div className="grid gap-2 ">
            <FormTextarea
              name="systemPrompt"
              control={control}
              label="System Prompt"
              placeholder="Enter a system prompt"
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-2 ">
            <FormSelect
              name="tone"
              control={control}
              label="Tone"
              placeholder="Select tone"
              options={behaviourTone}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2 ">
            <FormSelect
              name="verbosity"
              control={control}
              label="Verbosity"
              placeholder="Select verbosity"
              options={behaviorVerbosity}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2 ">
            <FormInput
              name="fallbackMessage"
              control={control}
              label="Fallback Message"
              placeholder="Enter a fallback message"
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2 ">
            <FormTextarea
              name="guardrails"
              control={control}
              label="Guardrails"
              placeholder="Enter a guardrails message"
              disabled={readOnly}
            />
          </div>
          <div className="flex justify-end">
            <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
              <Button
                type="submit"
                disabled={readOnly || !isDirty || saveBehaviourMutation.isPending}
              >
                {saveBehaviourMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DisabledTooltip>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default BehaviourCard;
