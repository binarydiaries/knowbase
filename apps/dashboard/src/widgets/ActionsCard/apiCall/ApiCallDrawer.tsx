import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Field, FieldLabel } from '@knowbase/ui/components/field';
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
import { FormInput } from '@/components/FormInput/FormInput';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea';
import { patchIntentsById, postIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import { API_CALL_INTENT, DEFAULT_FAILURE, DEFAULT_TRIGGER } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiTriggerConfig = {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, string>;
  responseInstructions?: string;
};

type IntentRow = {
  id: string;
  name: string;
  triggerInstructions: string;
  requiredFields: string[];
  config: { failure?: string } | null;
  actions: { actionType: string; config?: unknown }[];
};

// ── Form schema ───────────────────────────────────────────────────────────────

function jsonRecordField(label: string) {
  return z
    .string()
    .max(2000)
    .optional()
    .refine(
      (val) => {
        if (!val?.trim()) return true;
        try {
          const parsed = JSON.parse(val);
          return (
            typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed) &&
            Object.values(parsed).every((v) => typeof v === 'string')
          );
        } catch {
          return false;
        }
      },
      {
        message: `${label} must be a JSON object of string values, e.g. {"key": "value"}`,
      },
    );
}

const schema = z.object({
  triggerInstructions: z.string().max(300).optional(),
  fieldName: z
    .string()
    .min(1, 'Field name is required')
    .max(100)
    .regex(/^[\w-]+$/, 'Use letters, numbers, underscore, or hyphen only'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Must be a valid URL')
    .refine((v) => v.startsWith('https://'), 'Must be an HTTPS URL'),
  headers: jsonRecordField('Headers'),
  bodyTemplate: jsonRecordField('Body template'),
  responseInstructions: z
    .string()
    .min(1, 'Tell the agent how to phrase the answer')
    .max(500),
  failureMessage: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultValues(): FormValues {
  return {
    triggerInstructions: DEFAULT_TRIGGER,
    fieldName: 'orderNumber',
    method: 'GET',
    url: '',
    headers: '',
    bodyTemplate: '',
    responseInstructions:
      'Tell the user their order status and estimated delivery date.',
    failureMessage: DEFAULT_FAILURE,
  };
}

function intentToFormValues(intent: IntentRow): FormValues {
  const action = intent.actions.find((a) => a.actionType === 'api_trigger');
  const config = (action?.config as ApiTriggerConfig | undefined) ?? {};
  return {
    triggerInstructions: intent.triggerInstructions || DEFAULT_TRIGGER,
    fieldName: intent.requiredFields[0] ?? 'orderNumber',
    method: (config.method as FormValues['method']) ?? 'GET',
    url: config.url ?? '',
    headers: config.headers ? JSON.stringify(config.headers, null, 2) : '',
    bodyTemplate: config.bodyTemplate
      ? JSON.stringify(config.bodyTemplate, null, 2)
      : '',
    responseInstructions: config.responseInstructions ?? '',
    failureMessage: intent.config?.failure ?? DEFAULT_FAILURE,
  };
}

function formValuesToIntentPayload(values: FormValues, agentId: string) {
  const headers = values.headers?.trim()
    ? JSON.parse(values.headers)
    : undefined;
  const bodyTemplate = values.bodyTemplate?.trim()
    ? JSON.parse(values.bodyTemplate)
    : undefined;

  return {
    agentId,
    name: API_CALL_INTENT,
    triggerInstructions: values.triggerInstructions || DEFAULT_TRIGGER,
    requiredFields: [values.fieldName],
    optionalFields: [],
    executionMode: 'sequential' as const,
    config: { failure: values.failureMessage || DEFAULT_FAILURE },
    actions: [
      {
        actionType: 'api_trigger' as const,
        order: 0,
        config: {
          method: values.method,
          url: values.url,
          ...(headers ? { headers } : {}),
          ...(bodyTemplate ? { bodyTemplate } : {}),
          responseInstructions: values.responseInstructions,
        },
      },
    ],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApiCallDrawer({
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
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: intent ? intentToFormValues(intent) : defaultValues(),
  });

  useEffect(() => {
    reset(intent ? intentToFormValues(intent) : defaultValues());
  }, [intent?.id, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      let payload: ReturnType<typeof formValuesToIntentPayload>;
      try {
        payload = formValuesToIntentPayload(values, agentId);
      } catch {
        throw new Error('Headers and body template must be valid JSON.');
      }
      if (intent) {
        return patchIntentsById({
          path: { id: intent.id },
          body: {
            name: payload.name,
            triggerInstructions: payload.triggerInstructions,
            requiredFields: payload.requiredFields,
            optionalFields: payload.optionalFields,
            config: payload.config,
            actions: payload.actions,
          },
        });
      }
      return postIntents({ body: payload });
    },
    onSuccess: () => {
      toast.success('API call action saved.');
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
          <SheetTitle>API Call Action</SheetTitle>
          <SheetDescription>
            Let your agent call your API for live data, like order status, and
            answer with the real result.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-6">
          <div className="flex flex-col gap-1.5">
            <FormTextarea
              name="triggerInstructions"
              control={control}
              label="When to trigger"
              placeholder="e.g. When the user asks about their order status"
              maxLength={300}
              rows={2}
            />
          </div>

          <FormInput
            name="fieldName"
            control={control}
            label="Field to collect from the user"
            placeholder="orderNumber"
          />
          <p className="text-xs text-muted-foreground -mt-4">
            The agent will ask for this before calling the API. Reference it in
            the URL or body below as {'{{'}fieldName{'}}'}.
          </p>

          <div className="flex gap-3">
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Field className="w-32">
                  <FieldLabel>Method</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <div className="flex-1">
              <FormInput
                name="url"
                control={control}
                label="URL"
                placeholder="https://api.example.com/orders/{{orderNumber}}"
              />
            </div>
          </div>

          <FormTextarea
            name="headers"
            control={control}
            label="Headers (optional, JSON)"
            placeholder='{"Authorization": "Bearer ..."}'
            rows={2}
          />

          <FormTextarea
            name="bodyTemplate"
            control={control}
            label="Body template (optional, JSON)"
            placeholder='{"orderId": "{{orderNumber}}"}'
            rows={2}
          />

          <FormTextarea
            name="responseInstructions"
            control={control}
            label="How to phrase the answer"
            placeholder="Tell the user their order status and estimated delivery date."
            maxLength={500}
            rows={2}
          />

          <FormInput
            name="failureMessage"
            control={control}
            label="Fallback message if the lookup fails"
            placeholder={DEFAULT_FAILURE}
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
