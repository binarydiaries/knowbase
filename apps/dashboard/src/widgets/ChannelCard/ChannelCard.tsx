import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchChannelsById } from '@/services';
import { useChannels } from '@/store/useChannels.ts';

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
});
type ChannelFormValues = z.infer<typeof ChannelSchema>;
const ChannelCard = () => {
  // const [primaryColor, setPrimaryColor] = React.useState('#915964');
  const { chatbotId } = useParams({ strict: false });
  // const initialMessageId = useId();
  if (!chatbotId) {
    throw new Error('ChatbotId not available');
  }

  const channelWeb = useChannels((state) =>
    state.channelsByChatbotId[chatbotId]?.find(
      (channel) => channel.additional.type === 'web',
    ),
  );
  const channelConfig = channelWeb?.additional.config;
  const updateChannel = useChannels((s) => s.updateChannel);

  const {
    control,
    reset,
    watch,
    setValue,
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
    },
  });

  useEffect(() => {
    if (channelConfig) {
      reset({
        displayName: channelConfig.displayName ?? '',
        subtitle: channelConfig.subtitle ?? '',
        welcomeMessage: channelConfig.welcomeMessage ?? '',
        inputPlaceholder: channelConfig.inputPlaceholder ?? '',
        primaryColor: channelConfig.primaryColor ?? '#915964',
      });
    }
  }, [channelConfig, reset]);

  const primaryColor = watch('primaryColor');

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
            config: updatedConfig,
          },
        },
      });

      updateChannel(chatbotId, {
        id: channelWeb.id,
        additional: {
          ...channelWeb.additional,
          config: updatedConfig,
        },
      });
    },
  });

  /* -------------------- Submit -------------------- */

  const onSave = (values: ChannelFormValues) => {
    saveChannelMutation.mutate(values);
  };

  if (!channelWeb) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={'text-l'}>Channel</CardTitle>
        <CardDescription>Chatbot Channel</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSave)}>
        <CardContent className={'flex-col gap-5 flex'}>
          <div className="grid gap-2 ">
            <FormInput
              name="displayName"
              control={control}
              label="Display Name"
              placeholder="Enter a display Name"
            />
          </div>
          <div className="grid gap-2 ">
            <FormInput
              name="subtitle"
              control={control}
              label="Subtitle"
              placeholder="Enter a subtitle"
            />
          </div>
          <div className="grid gap-2 ">
            <FormTextarea
              name="welcomeMessage"
              control={control}
              label="Welcome Message"
              placeholder="Enter a welcome message"
            />
          </div>
          <div className="grid gap-2 ">
            <FormInput
              name="inputPlaceholder"
              control={control}
              label="Input Placeholder"
              placeholder="Enter a input placeholder"
            />
          </div>
          {/* Primary Color */}
          <div className="space-y-2">
            <Label>Primary Color</Label>

            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) =>
                  setValue('primaryColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />

              <Input
                value={primaryColor}
                onChange={(e) =>
                  setValue('primaryColor', e.target.value, {
                    shouldValidate: true,
                  })
                }
                className="max-w-[140px]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || saveChannelMutation.isPending}
            >
              {saveChannelMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default ChannelCard;
