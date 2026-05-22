import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Label } from '@knowbase/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchAgentActionsById } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

type SchedulingConfig = {
  eventTypeId?: number;
  timezone?: string;
  slotsToShow?: number;
  triggerInstructions?: string;
  confirmationMessage?: string;
};

type Action = {
  id: string;
  config: SchedulingConfig;
};

const schema = z.object({
  eventTypeId: z.coerce.number().int().positive('Must be a positive integer'),
  timezone: z.string().min(1, 'Timezone is required'),
  slotsToShow: z.coerce.number().int().min(1).max(20).optional(),
  triggerInstructions: z
    .string()
    .max(300, 'Must be at most 300 characters')
    .optional(),
  confirmationMessage: z
    .string()
    .max(200, 'Must be at most 200 characters')
    .optional(),
});
type FormValues = z.infer<typeof schema>;

export function SchedulingConfigDrawer({
  action,
  open,
  onClose,
  onSaved,
}: {
  action: Action;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cfg = action.config;

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventTypeId: cfg.eventTypeId ?? ('' as unknown as number),
      timezone: cfg.timezone ?? 'auto',
      slotsToShow: cfg.slotsToShow ?? 6,
      triggerInstructions: cfg.triggerInstructions ?? '',
      confirmationMessage:
        cfg.confirmationMessage ?? 'Your appointment has been booked!',
    },
  });

  useEffect(() => {
    reset({
      eventTypeId: action.config.eventTypeId ?? ('' as unknown as number),
      timezone: action.config.timezone ?? 'auto',
      slotsToShow: action.config.slotsToShow ?? 6,
      triggerInstructions: action.config.triggerInstructions ?? '',
      confirmationMessage:
        action.config.confirmationMessage ??
        'Your appointment has been booked!',
    });
  }, [action.id, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      patchAgentActionsById({
        path: { id: action.id },
        body: {
          config: {
            eventTypeId: values.eventTypeId,
            timezone: values.timezone,
            slotsToShow: values.slotsToShow,
            triggerInstructions: values.triggerInstructions || undefined,
            confirmationMessage: values.confirmationMessage || undefined,
          },
        },
      }),
    onSuccess: () => {
      toast.success('Scheduling settings saved.');
      onSaved();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-6 py-4">
          <SheetTitle>Appointment Scheduling</SheetTitle>
          <SheetDescription>
            Configure how your agent books Cal.com appointments.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-6">
          <FormInput
            name="eventTypeId"
            control={control}
            label="Cal.com Event Type ID"
            placeholder="e.g. 12345"
          />

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Timezone</Label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto (browser timezone)
                    </SelectItem>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <FormInput
            name="slotsToShow"
            control={control}
            label="Max slots to show (optional)"
            placeholder="6"
          />

          <FormTextarea
            name="triggerInstructions"
            control={control}
            label="Trigger instructions (optional)"
            placeholder="e.g. Only offer scheduling when the user asks to book a demo."
            maxLength={300}
            rows={3}
          />

          <FormInput
            name="confirmationMessage"
            control={control}
            label="Confirmation message (optional)"
            placeholder="Your appointment has been booked!"
            maxLength={200}
          />
        </div>

        <SheetFooter className="px-6 py-4 border-t mt-auto">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit((values) => saveMutation.mutate(values))}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
