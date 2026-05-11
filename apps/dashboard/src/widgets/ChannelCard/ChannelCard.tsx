import * as amplitude from '@amplitude/unified';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormInputColor } from '@/components/FormInputColor/FormInputColor.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchChannelsById } from '@/services';
import { useChannels } from '@/store/useChannels.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

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

  suggestionQuestions: z
    .string()
    .max(500, 'Suggestion questions are too long (max 500 characters)')
    .optional(),

  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Primary color must be a valid hex color'),
});
type ChannelFormValues = z.infer<typeof ChannelSchema>;
const ChannelCard = ({ readOnly = false }: { readOnly?: boolean }) => {
  // const [primaryColor, setPrimaryColor] = React.useState('#915964');
  const { agentId } = useParams({ strict: false });
  // const initialMessageId = useId();
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
      suggestionQuestions: '',
      primaryColor: '#915964',
    },
  });

  useEffect(() => {
    if (channelConfig) {
      reset({
        displayName: channelConfig.displayName ?? '',
        subtitle: channelConfig.subtitle ?? '',
        welcomeMessage: channelConfig.welcomeMessage ?? '',
        inputPlaceholder: channelConfig.inputPlaceholder ?? '',
        suggestionQuestions: (channelConfig.suggestionQuestions ?? []).join('\n'),
        primaryColor: channelConfig.primaryColor ?? '#915964',
      });
    }
  }, [channelConfig, reset]);

  const saveChannelMutation = useMutation({
    mutationFn: async (values: ChannelFormValues) => {
      if (!channelWeb) return;

      const updatedConfig = {
        ...values,
        suggestionQuestions: (values.suggestionQuestions ?? '')
          .split('\n')
          .map((question) => question.trim())
          .filter((question) => question.length > 0)
          .slice(0, 6),
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
      toast.success('Channel settings saved');
      amplitude.track('Channel Settings Saved', { agent_id: agentId, channel_type: 'web' });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  /* -------------------- Submit -------------------- */

  const onSave = (values: ChannelFormValues) => {
    saveChannelMutation.mutate(values);
  };

  if (!channelWeb) return null;

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="flex-col gap-5 flex">
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
        <FormTextarea
          name="suggestionQuestions"
          control={control}
          label="Suggestion Questions"
          placeholder="One question per line"
          disabled={readOnly}
        />
        <FormInputColor
          control={control}
          name="primaryColor"
          label="Primary Color"
          disabled={readOnly}
        />
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
      </div>
    </form>
  );
};

export default ChannelCard;
