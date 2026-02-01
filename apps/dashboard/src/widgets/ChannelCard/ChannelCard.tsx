import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';

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

const ChannelCard = () => {
  const [primaryColor, setPrimaryColor] = React.useState('#915964');

  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(ChannelSchema),
    mode: 'all',
  });
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={'text-l'}>Channel</CardTitle>
        <CardDescription>Chatbot Channel</CardDescription>
      </CardHeader>
      {/*displayName: z.string(), I*/}
      {/*subtitle: z.string().optional(), I*/}
      {/*welcomeMessage: z.string(), Textarea*/}
      {/*inputPlaceholder: z.string().optional(), I*/}
      {/*primaryColor: z.string(),*/}
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
            {/* Color input */}
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer p-1"
            />

            {/* Hex input */}
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="max-w-[140px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelCard;
