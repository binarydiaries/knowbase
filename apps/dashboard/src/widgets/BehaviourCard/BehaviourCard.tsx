import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormSelect } from '@/components/FormSelect/FormSelect.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchBehaviourById } from '@/services';
import { useBehaviour } from '@/store/useBehaviour.ts';

export const chatbotBehaviourSchema = z.object({
  systemPrompt: z
    .string()
    .min(20, 'System prompt is too short')
    .max(500, 'System prompt is too long (max 500 characters)'),

  tone: z.enum(['friendly', 'professional', 'neutral']),

  verbosity: z.enum(['short', 'balanced', 'detailed']),

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
const BehaviourCard = () => {
  const { chatbotId } = useParams({ strict: false });
  if (!chatbotId) throw new Error('ChatbotId not available');

  const behaviour = useBehaviour(
    (state) => state.behaviourByChatbotId[chatbotId],
  );
  console.log('behaviour', behaviour, 'chatbotId', chatbotId);
  const patchBehaviour = useBehaviour((s) => s.updateBehaviour);
  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm<BehaviourFormValues>({
    resolver: zodResolver(chatbotBehaviourSchema),
    mode: 'all',
    defaultValues: {
      systemPrompt: '',
      tone: 'friendly',
      verbosity: 'short',
      fallbackMessage: '',
      guardrails: '',
    },
  });

  useEffect(() => {
    if (behaviour) {
      reset({
        systemPrompt: behaviour.systemPrompt,
        tone: behaviour.tone,
        verbosity: behaviour.verbosity,
        fallbackMessage: behaviour.fallbackMessage,
        guardrails: behaviour.guardrails,
      });
    }
  }, [behaviour, reset]);

  const saveBehaviourMutation = useMutation({
    mutationFn: async (values: BehaviourFormValues) => {
      await patchBehaviourById({
        path: { id: behaviour.id },
        body: values,
      });

      // 🔥 instant UI update
      patchBehaviour(chatbotId, values);
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
              label="Sysyem Prompt"
              placeholder="Enter a system prompt"
            />
          </div>

          <div className="grid gap-2 ">
            <FormSelect
              name="tone"
              control={control}
              label="Tone"
              placeholder="Select tone"
              options={[
                { label: 'Friendly', value: 'friendly' },
                { label: 'Professional', value: 'professional' },
                { label: 'Neutral', value: 'neutral' },
              ]}
            />
          </div>
          <div className="grid gap-2 ">
            <FormSelect
              name="verbosity"
              control={control}
              label="Verbosity"
              placeholder="Select verbosity"
              options={[
                { label: 'Short', value: 'short' },
                { label: 'Balanced', value: 'balanced' },
                { label: 'Detailed', value: 'detailed' },
              ]}
            />
          </div>
          <div className="grid gap-2 ">
            <FormInput
              name="fallbackMessage"
              control={control}
              label="Fallback Message"
              placeholder="Enter a fallback message"
            />
          </div>
          <div className="grid gap-2 ">
            <FormTextarea
              name="guardrails"
              control={control}
              label="Guardrails"
              placeholder="Enter a guardrails message"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || saveBehaviourMutation.isPending}
            >
              {saveBehaviourMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default BehaviourCard;
