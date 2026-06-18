import * as amplitude from '@amplitude/unified';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect, useRef, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Bot, Trash, Upload } from 'lucide-react';
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

  allowedDomains: z.string().optional(),

  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Primary color must be a valid hex color'),

  avatarUrl: z.string().optional(),
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
  const channelConfig =
    channelAdditional?.type === 'web' ? channelAdditional.config : undefined;
  const updateChannel = useChannels((s) => s.updateChannel);

  const {
    control,
    reset,
    handleSubmit,
    setValue,
    watch,
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
      allowedDomains: '',
      primaryColor: '#915964',
      avatarUrl: '',
    },
  });

  const avatarUrl = watch('avatarUrl');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setValue('avatarUrl', compressedBase64, { shouldDirty: true });
          toast.success('Avatar uploaded and compressed successfully!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (channelConfig) {
      reset({
        displayName: channelConfig.displayName ?? '',
        subtitle: channelConfig.subtitle ?? '',
        welcomeMessage: channelConfig.welcomeMessage ?? '',
        inputPlaceholder: channelConfig.inputPlaceholder ?? '',
        suggestionQuestions: (channelConfig.suggestionQuestions ?? []).join(
          '\n',
        ),
        allowedDomains: (channelConfig.allowedDomains ?? []).join('\n'),
        primaryColor: channelConfig.primaryColor ?? '#915964',
        avatarUrl: (channelConfig as { avatarUrl?: string }).avatarUrl ?? '',
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
        allowedDomains: (values.allowedDomains ?? '')
          .split('\n')
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d.length > 0),
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
      amplitude.track('Channel Settings Saved', {
        agent_id: agentId,
        channel_type: 'web',
      });
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
        {/* Avatar Uploader Widget (Compact) */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/40 max-w-md">
          <div className="size-10 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Agent avatar preview"
                className="size-full object-cover"
              />
            ) : (
              <Bot className="size-5 text-muted-foreground opacity-70" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">Agent Avatar</span>
            <span className="text-[10px] text-muted-foreground truncate leading-normal">
              128x128px recommended (auto-compressed)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={readOnly}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 h-7 px-2.5 text-xs font-normal"
              disabled={readOnly}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Upload
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 flex items-center justify-center"
                disabled={readOnly}
                onClick={() => setValue('avatarUrl', '', { shouldDirty: true })}
                title="Remove Avatar"
              >
                <Trash className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

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
        <FormTextarea
          name="allowedDomains"
          control={control}
          label="Allowed Domains"
          placeholder="One domain per line, e.g. example.com"
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
