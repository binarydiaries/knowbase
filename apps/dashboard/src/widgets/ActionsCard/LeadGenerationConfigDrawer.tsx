import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Label } from '@knowbase/ui/components/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { Switch } from '@knowbase/ui/components/switch';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
import { patchAgentActionsById } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';

type LeadFieldConfig = {
  collect: boolean;
  required: boolean;
};

type LeadConfig = {
  fields?: {
    name?: LeadFieldConfig;
    email?: LeadFieldConfig;
    phone?: LeadFieldConfig;
    company?: LeadFieldConfig;
  };
  triggerInstructions?: string;
  successMessage?: string;
};

type Action = {
  id: string;
  config: LeadConfig;
};

const FIELD_LABELS: Record<keyof NonNullable<LeadConfig['fields']>, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  company: 'Company',
};

const DEFAULT_FIELDS = {
  name: { collect: true, required: true },
  email: { collect: true, required: true },
  phone: { collect: false, required: false },
  company: { collect: false, required: false },
};

const fieldConfigSchema = z.object({
  collect: z.boolean(),
  required: z.boolean(),
});

const schema = z.object({
  fields: z.object({
    name: fieldConfigSchema,
    email: fieldConfigSchema,
    phone: fieldConfigSchema,
    company: fieldConfigSchema,
  }),
  triggerInstructions: z
    .string()
    .max(300, 'Must be at most 300 characters')
    .optional(),
  successMessage: z
    .string()
    .min(1, 'Success message is required')
    .max(200, 'Must be at most 200 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LeadGenerationConfigDrawer({
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
  const posthog = usePostHog();
  const cfg = action.config;

  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fields: cfg.fields ?? DEFAULT_FIELDS,
      triggerInstructions: cfg.triggerInstructions ?? '',
      successMessage: cfg.successMessage ?? "Thanks! We'll be in touch.",
    },
  });

  useEffect(() => {
    reset({
      fields: action.config.fields ?? DEFAULT_FIELDS,
      triggerInstructions: action.config.triggerInstructions ?? '',
      successMessage: action.config.successMessage ?? "Thanks! We'll be in touch.",
    });
  }, [action.id, reset]);

  const fieldsValues = watch('fields');

  const saveMutation = useMutation({
    mutationFn: ({ fields, triggerInstructions, successMessage }: FormValues) =>
      patchAgentActionsById({
        path: { id: action.id },
        body: {
          config: {
            fields,
            triggerInstructions: triggerInstructions || undefined,
            successMessage: successMessage || undefined,
          },
        },
      }),
    onSuccess: (_, values) => {
      posthog.capture('lead_generation_configured', {
        action_id: action.id,
        fields_collected: Object.entries(values.fields)
          .filter(([, v]) => v?.collect)
          .map(([k]) => k),
      });
      toast.success('Lead generation settings saved.');
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
          <SheetTitle>Lead Generation</SheetTitle>
          <SheetDescription>
            Configure which contact fields the agent collects.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-6">
          {/* Fields configuration */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Fields to collect</Label>
            <div className="rounded-lg border divide-y">
              {(Object.keys(FIELD_LABELS) as (keyof NonNullable<LeadConfig['fields']>)[]).map(
                (key) => {
                  const isCollected = fieldsValues[key]?.collect ?? false;

                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{FIELD_LABELS[key]}</span>
                        {isCollected && (
                          <div className="flex items-center gap-2 mt-1">
                            <Controller
                              control={control}
                              name={`fields.${key}.required`}
                              render={({ field }) => (
                                <Switch
                                  id={`${key}-required`}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="scale-75 origin-left"
                                />
                              )}
                            />
                            <label
                              htmlFor={`${key}-required`}
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Required
                            </label>
                          </div>
                        )}
                      </div>
                      <Controller
                        control={control}
                        name={`fields.${key}.collect`}
                        render={({ field }) => (
                          <Switch
                            id={`${key}-collect`}
                            checked={field.value}
                            onCheckedChange={(v) => {
                              field.onChange(v);
                              if (!v) {
                                setValue(`fields.${key}.required`, false);
                              }
                            }}
                          />
                        )}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Trigger instructions */}
          <FormTextarea
            name="triggerInstructions"
            control={control}
            label="Trigger instructions (optional)"
            placeholder="e.g. Only capture lead if user explicitly asks to be contacted."
            maxLength={300}
            rows={3}
          />

          {/* Success message */}
          <FormInput
            name="successMessage"
            control={control}
            label="Success message"
            placeholder="Thanks! We'll be in touch."
            maxLength={200}
          />
        </div>

        <SheetFooter className="px-6 py-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
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
