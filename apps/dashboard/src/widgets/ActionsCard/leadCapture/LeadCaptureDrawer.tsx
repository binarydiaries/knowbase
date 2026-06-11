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
import { toast } from '@knowbase/ui/components/sonner';
import { Switch } from '@knowbase/ui/components/switch';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea';
import { patchIntentsById, postIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { DEFAULT_SUCCESS, DEFAULT_TRIGGER, LEAD_GENERATION_INTENT } from './constants';


// ── Types ─────────────────────────────────────────────────────────────────────

type IntentRow = {
  id: string;
  name: string;
  triggerInstructions: string;
  requiredFields: string[];
  config: { success?: string } | null;
  actions: { actionType: string }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const FIELD_KEYS = ['name', 'email', 'phone', 'company'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  company: 'Company',
};

// ── Form schema ───────────────────────────────────────────────────────────────

const fieldSchema = z.object({
  collect: z.boolean(),
  required: z.boolean(),
});

const schema = z.object({
  fields: z.object({
    name: fieldSchema,
    email: fieldSchema,
    phone: fieldSchema,
    company: fieldSchema,
  }),
  triggerInstructions: z
    .string()
    .max(300, 'Must be at most 300 characters')
    .optional(),
  successMessage: z
    .string()
    .min(1, 'Success message is required')
    .max(300, 'Must be at most 300 characters'),
  emailNotification: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultFieldValues(): FormValues['fields'] {
  return {
    name: { collect: true, required: true },
    email: { collect: true, required: true },
    phone: { collect: false, required: false },
    company: { collect: false, required: false },
  };
}

function intentToFormValues(intent: IntentRow): FormValues {
  const required = new Set(intent.requiredFields);
  return {
    fields: {
      name: { collect: required.has('name'), required: required.has('name') },
      email: { collect: required.has('email'), required: required.has('email') },
      phone: { collect: required.has('phone'), required: required.has('phone') },
      company: { collect: required.has('company'), required: required.has('company') },
    },
    triggerInstructions: intent.triggerInstructions || DEFAULT_TRIGGER,
    successMessage: intent.config?.success ?? DEFAULT_SUCCESS,
    emailNotification: intent.actions.some((a) => a.actionType === 'send_email'),
  };
}

function formValuesToIntentPayload(values: FormValues, agentId: string) {
  const requiredFields = FIELD_KEYS.filter((k) => values.fields[k].required);
  const actions: { actionType: 'save_lead' | 'send_email'; order: number; config: Record<string, unknown> }[] = [
    { actionType: 'save_lead', order: 0, config: {} },
  ];
  if (values.emailNotification) {
    actions.push({ actionType: 'send_email', order: 1, config: {} });
  }
  return {
    agentId,
    name: LEAD_GENERATION_INTENT,
    triggerInstructions: values.triggerInstructions || DEFAULT_TRIGGER,
    requiredFields,
    executionMode: 'sequential' as const,
    config: { success: values.successMessage },
    actions,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadCaptureDrawer({
  agentId,
  intent,
  open,
  onClose,
  onSaved,
}: {
  agentId: string;
  intent: IntentRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>(
    {
      resolver: zodResolver(schema),
      defaultValues: intent
        ? intentToFormValues(intent)
        : {
            fields: defaultFieldValues(),
            triggerInstructions: DEFAULT_TRIGGER,
            successMessage: DEFAULT_SUCCESS,
            emailNotification: false,
          },
    },
  );

  useEffect(() => {
    reset(
      intent
        ? intentToFormValues(intent)
        : {
            fields: defaultFieldValues(),
            triggerInstructions: DEFAULT_TRIGGER,
            successMessage: DEFAULT_SUCCESS,
            emailNotification: false,
          },
    );
  }, [intent?.id, reset]);

  const fieldsValues = watch('fields');

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = formValuesToIntentPayload(values, agentId);
      if (intent) {
        return patchIntentsById({
          path: { id: intent.id },
          body: {
            name: payload.name,
            triggerInstructions: payload.triggerInstructions,
            requiredFields: payload.requiredFields,
            config: payload.config,
            actions: payload.actions,
          },
        });
      }
      return postIntents({ body: payload });
    },
    onSuccess: () => {
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
            Configure which contact fields the agent collects and when to
            trigger collection.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-6">
          {/* Fields */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Fields to collect</Label>
            <div className="rounded-lg border divide-y">
              {FIELD_KEYS.map((key) => {
                const isCollected = fieldsValues[key]?.collect ?? false;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {FIELD_LABELS[key]}
                      </span>
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
                            if (!v) setValue(`fields.${key}.required`, false);
                          }}
                        />
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger instructions */}
          <div className="flex flex-col gap-1.5">
            <FormTextarea
              name="triggerInstructions"
              control={control}
              label="When to trigger"
              placeholder="e.g. When asked for a demo, or when the user wants to be contacted"
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground -mt-1">
              Describe the situations when your agent should start collecting contact info.
            </p>
          </div>

          {/* Success message */}
          <FormInput
            name="successMessage"
            control={control}
            label="Success message"
            placeholder="Thanks! We'll be in touch."
            maxLength={300}
          />

          {/* Email notification */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Notifications</Label>
            <div className="rounded-lg border">
              <Controller
                control={control}
                name="emailNotification"
                render={({ field }) => (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border p-1.5">
                        <Mail className="size-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email notification</p>
                        <p className="text-xs text-muted-foreground">
                          Send an email to your account when a new lead is captured.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>
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
