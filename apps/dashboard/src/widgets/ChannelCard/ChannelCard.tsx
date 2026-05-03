import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Field, FieldLabel } from '@knowbase/ui/components/field';
import { Switch } from '@knowbase/ui/components/switch';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormInputColor } from '@/components/FormInputColor/FormInputColor.tsx';
import { FormSelect } from '@/components/FormSelect/FormSelect.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchChannelsById } from '@/services';
import { useChannels } from '@/store/useChannels.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

const TTS_VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

export const ChannelSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name is too short')
    .max(40, 'Display name is too long (max 40 characters)'),

  subtitle: z
    .string()
    .max(80, 'Subtitle is too long (max 80 characters)')
    .optional(),

  welcomeMessage: z
    .string()
    .min(5, 'Welcome message is too short')
    .max(300, 'Welcome message is too long (max 300 characters)'),

  inputPlaceholder: z
    .string()
    .max(60, 'Input placeholder is too long (max 60 characters)')
    .optional(),

  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Primary color must be a valid hex color'),

  voiceEnabled: z.boolean(),

  ttsVoice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
});

type ChannelFormValues = z.infer<typeof ChannelSchema>;

const ChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  const posthog = usePostHog();
  const { agentId } = useParams({ strict: false });
  if (!agentId) {
    throw new Error('agentId not available');
  }

  const channelWeb = useChannels((state) =>
    state.channelsByAgentId[agentId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );
  const channelAdditional = channelWeb?.additional;
  const channelConfig = channelAdditional?.type === 'web' ? channelAdditional.config : undefined;
  const updateChannel = useChannels((s) => s.updateChannel);

  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ChannelFormValues>({
    resolver: zodResolver(ChannelSchema),
    mode: 'all',
    defaultValues: {
      displayName: '',
      subtitle: '',
      welcomeMessage: '',
      inputPlaceholder: '',
      primaryColor: '#915964',
      voiceEnabled: false,
      ttsVoice: 'alloy',
    },
  });

  const { field: voiceEnabledField } = useController({ control, name: 'voiceEnabled' });
  const voiceEnabled = useWatch({ control, name: 'voiceEnabled' });

  useEffect(() => {
    if (channelConfig) {
      const cfg = channelConfig as typeof channelConfig & {
        voiceEnabled?: boolean;
        ttsVoice?: string;
      };
      reset({
        displayName: cfg.displayName ?? '',
        subtitle: cfg.subtitle ?? '',
        welcomeMessage: cfg.welcomeMessage ?? '',
        inputPlaceholder: cfg.inputPlaceholder ?? '',
        primaryColor: cfg.primaryColor ?? '#915964',
        voiceEnabled: cfg.voiceEnabled ?? false,
        ttsVoice: (cfg.ttsVoice as ChannelFormValues['ttsVoice']) ?? 'alloy',
      });
    }
  }, [channelConfig, reset]);

  const saveChannelMutation = useMutation({
    mutationFn: async (values: ChannelFormValues) => {
      if (!channelWeb) return;

      const updatedConfig = {
        ...values,
        allowedDomains: channelConfig?.allowedDomains ?? [],
      };

      await patchChannelsById({
        path: { id: channelWeb.id },
        body: {
          additional: {
            ...channelWeb.additional,
            type: 'web',
            config: updatedConfig,
          },
        },
      });

      updateChannel(agentId, {
        id: channelWeb.id,
        additional: {
          ...channelWeb.additional,
          type: 'web',
          config: updatedConfig,
        },
      });
    },
    onSuccess: () => {
      posthog.capture('agent_channel_saved', {
        agent_id: agentId,
        channel_type: 'web',
      });
      toast.success('Channel settings saved');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSave = (values: ChannelFormValues) => {
    saveChannelMutation.mutate(values);
  };

  if (!channelWeb) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={'text-l'}>Channel</CardTitle>
        <CardDescription>Agent Channel</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSave)}>
        <CardContent className={'flex-col gap-5 flex'}>
          <FormInput
            name="displayName"
            control={control}
            label="Display Name"
            placeholder="Enter a display Name"
            disabled={readOnly}
          />
          <FormInput
            name="subtitle"
            control={control}
            label="Subtitle"
            placeholder="Enter a subtitle"
            disabled={readOnly}
          />
          <FormTextarea
            name="welcomeMessage"
            control={control}
            label="Welcome Message"
            placeholder="Enter a welcome message"
            disabled={readOnly}
          />
          <FormInput
            name="inputPlaceholder"
            control={control}
            label="Input Placeholder"
            placeholder="Enter a input placeholder"
            disabled={readOnly}
          />
          <FormInputColor
            control={control}
            name="primaryColor"
            label="Primary Color"
            disabled={readOnly}
          />

          <Field>
            <div className="flex items-center gap-3">
              <Switch
                checked={voiceEnabledField.value}
                onCheckedChange={voiceEnabledField.onChange}
                disabled={readOnly}
              />
              <FieldLabel>Enable Voice Calls</FieldLabel>
            </div>
          </Field>

          {voiceEnabled && (
            <FormSelect
              name="ttsVoice"
              control={control}
              label="AI Voice"
              options={TTS_VOICE_OPTIONS}
            />
          )}

          <div className="flex justify-end">
            <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
              <Button
                type="submit"
                disabled={readOnly || !isDirty || saveChannelMutation.isPending}
              >
                {saveChannelMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DisabledTooltip>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default ChannelCard;
