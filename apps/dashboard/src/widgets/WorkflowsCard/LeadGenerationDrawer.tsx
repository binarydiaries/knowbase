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
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea';
import { patchWorkflowsById, postWorkflows } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';

// ── Types ─────────────────────────────────────────────────────────────────────
type WorkflowRow = {
  id: string;
  intentName: string;
  requiredFields: string[];
  config: { success?: string } | null;
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

const DEFAULT_INTENT =
  'user wants to provide contact information or be contacted';
const DEFAULT_SUCCESS = "Thanks! We'll be in touch.";

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
  intentName: z
    .string()
    .min(1, 'Trigger is required')
    .max(300, 'Must be at most 300 characters'),
  successMessage: z
    .string()
    .min(1, 'Success message is required')
    .max(300, 'Must be at most 300 characters'),
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

function workflowToFormValues(workflow: WorkflowRow): FormValues {
  const required = new Set(workflow.requiredFields);
  return {
    fields: {
      name: { collect: required.has('name'), required: required.has('name') },
      email: {
        collect: required.has('email'),
        required: required.has('email'),
      },
      phone: {
        collect: required.has('phone'),
        required: required.has('phone'),
      },
      company: {
        collect: required.has('company'),
        required: required.has('company'),
      },
    },
    intentName: workflow.intentName,
    successMessage: workflow.config?.success ?? DEFAULT_SUCCESS,
  };
}

function formValuesToWorkflowPayload(values: FormValues, agentId: string) {
  const requiredFields = FIELD_KEYS.filter((k) => values.fields[k].required);
  return {
    agentId,
    name: 'Lead Generation',
    intentName: values.intentName,
    requiredFields,
    executionMode: 'sequential' as const,
    config: { success: values.successMessage },
    actions: [{ actionType: 'save_lead' as const, order: 0, config: {} }],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadGenerationDrawer({
  agentId,
  workflow,
  open,
  onClose,
  onSaved,
}: {
  agentId: string;
  workflow: WorkflowRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { control, handleSubmit, watch, setValue, reset } = useForm<FormValues>(
    {
      resolver: zodResolver(schema),
      defaultValues: workflow
        ? workflowToFormValues(workflow)
        : {
            fields: defaultFieldValues(),
            intentName: DEFAULT_INTENT,
            successMessage: DEFAULT_SUCCESS,
          },
    },
  );

  useEffect(() => {
    reset(
      workflow
        ? workflowToFormValues(workflow)
        : {
            fields: defaultFieldValues(),
            intentName: DEFAULT_INTENT,
            successMessage: DEFAULT_SUCCESS,
          },
    );
  }, [workflow?.id, reset]);

  const fieldsValues = watch('fields');

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = formValuesToWorkflowPayload(values, agentId);
      if (workflow) {
        return patchWorkflowsById({
          path: { id: workflow.id },
          body: {
            name: payload.name,
            intentName: payload.intentName,
            requiredFields: payload.requiredFields,
            config: payload.config,
            actions: payload.actions,
          },
        });
      }
      return postWorkflows({ body: payload });
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

          {/* Trigger */}
          <div className="flex flex-col gap-1.5">
            <FormTextarea
              name="intentName"
              control={control}
              label="When to trigger"
              placeholder="e.g. user wants to be contacted or provide their details"
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground -mt-1">
              Describe when the agent should start collecting contact info.
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
