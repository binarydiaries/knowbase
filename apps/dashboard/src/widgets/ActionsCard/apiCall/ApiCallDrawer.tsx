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
import { FormInput } from '@/components/FormInput/FormInput';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea';
import { patchIntentsById, postIntents } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';
import type { IntentRow } from '../types';
import {
  type ApiCallFormValues,
  apiCallDefaultValues,
  apiCallFormSchema,
  apiCallFormValuesToIntentPayload,
  apiCallIntentToFormValues,
  parseApiCallJsonFields,
} from './apiCallForm';
import { DEFAULT_FAILURE } from './constants';
import { TestConnectionPanel } from './TestConnectionPanel';

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
  const { control, handleSubmit, reset, trigger, getValues, watch } =
    useForm<ApiCallFormValues>({
      resolver: zodResolver(apiCallFormSchema),
      defaultValues: intent
        ? apiCallIntentToFormValues(intent)
        : apiCallDefaultValues(),
    });

  const fieldName = watch('fieldName');

  useEffect(() => {
    reset(intent ? apiCallIntentToFormValues(intent) : apiCallDefaultValues());
  }, [intent?.id, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ApiCallFormValues) => {
      let payload: ReturnType<typeof apiCallFormValuesToIntentPayload>;
      try {
        payload = apiCallFormValuesToIntentPayload(values, agentId);
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

          <TestConnectionPanel
            agentId={agentId}
            fieldName={fieldName}
            resetKey={intent?.id}
            validate={() =>
              trigger(['fieldName', 'method', 'url', 'headers', 'bodyTemplate'])
            }
            getRequestConfig={() => {
              const values = getValues();
              return {
                method: values.method,
                url: values.url,
                ...parseApiCallJsonFields(values),
              };
            }}
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
