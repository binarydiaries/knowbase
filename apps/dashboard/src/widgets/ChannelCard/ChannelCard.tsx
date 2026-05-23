import * as amplitude from '@amplitude/unified';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect, useRef, type ChangeEvent } from 'react';
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
        {/* Avatar Uploader Widget */}
        <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/40 border border-border/50">
          <div className="relative group shrink-0">
            <div className="size-20 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center shadow-inner relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Agent avatar preview"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 27 27"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-60"
                  >
                    <title>Agent</title>
                    <path
                      d="M13.5 18.5V8.5M8.5 16V11M18.5 16V11M19.75 2.67228C17.9114 1.60871 15.7768 1 13.5 1C6.59644 1 1 6.59644 1 13.5C1 15.4996 1.46952 17.3895 2.30432 19.0656C2.52617 19.511 2.60001 20.0201 2.4714 20.5007L1.72689 23.2834C1.40369 24.4912 2.50876 25.5963 3.71669 25.2731L6.49924 24.5286C6.97991 24.4 7.48901 24.4739 7.93441 24.6956C9.61046 25.5305 11.5004 26 13.5 26C20.4035 26 26 20.4035 26 13.5C26 11.2232 25.3913 9.08859 24.3278 7.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Agent Avatar</span>
            <span className="text-xs text-muted-foreground">
              Recommended: 128x128px. Max 1MB (automatically compressed).
            </span>
            <div className="flex items-center gap-2 mt-1">
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
                className="cursor-pointer gap-1.5 h-8 text-xs font-normal"
                disabled={readOnly}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                >
                  <title>Upload icon</title>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Photo
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer gap-1.5 h-8 text-xs font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={readOnly}
                  onClick={() =>
                    setValue('avatarUrl', '', { shouldDirty: true })
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                  >
                    <title>Remove icon</title>
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Remove
                </Button>
              )}
            </div>
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
