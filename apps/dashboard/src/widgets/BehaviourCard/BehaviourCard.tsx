import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormSelect } from '@/components/FormSelect/FormSelect.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';

export const chatbotBehaviourSchema = z.object({
  systemPrompt: z
    .string()
    .min(20, 'System prompt is too short')
    .max(500, 'System prompt is too long (max 500 characters)'),

  tone: z.enum(['friendly', 'professional', 'neutral'], {
    required_error: 'Tone is required',
  }),

  verbosity: z.enum(['short', 'balanced', 'detailed'], {
    required_error: 'Verbosity is required',
  }),

  fallbackMessage: z
    .string()
    .min(5, 'Fallback message is too short')
    .max(120, 'Fallback message is too long (max 120 characters)'),

  guardrails: z
    .string()
    .max(300, 'Guardrails are too long (max 300 characters)')
    .optional(), // textarea, optional unless you want it required
});

const BehaviourCard = () => {
  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(chatbotBehaviourSchema),
    mode: 'all',
  });
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={'text-l'}>Behaviour</CardTitle>
        <CardDescription>Chatbot behaviours</CardDescription>
      </CardHeader>
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
      </CardContent>
    </Card>
  );
};

export default BehaviourCard;
