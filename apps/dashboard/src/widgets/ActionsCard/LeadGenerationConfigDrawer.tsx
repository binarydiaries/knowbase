import { Button } from '@knowbase/ui/components/button';
import { Input } from '@knowbase/ui/components/input';
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
import { Textarea } from '@knowbase/ui/components/textarea';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
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

const DEFAULT_FIELDS: NonNullable<LeadConfig['fields']> = {
  name: { collect: true, required: true },
  email: { collect: true, required: true },
  phone: { collect: false, required: false },
  company: { collect: false, required: false },
};

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
  const [fields, setFields] = useState<NonNullable<LeadConfig['fields']>>(
    cfg.fields ?? DEFAULT_FIELDS,
  );
  const [triggerInstructions, setTriggerInstructions] = useState(
    cfg.triggerInstructions ?? '',
  );
  const [successMessage, setSuccessMessage] = useState(
    cfg.successMessage ?? "Thanks! We'll be in touch.",
  );

  const saveMutation = useMutation({
    mutationFn: () =>
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
    onSuccess: () => {
      posthog.capture('lead_generation_configured', {
        action_id: action.id,
        fields_collected: Object.entries(fields)
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

  const setFieldCollect = (
    key: keyof NonNullable<LeadConfig['fields']>,
    collect: boolean,
  ) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], collect, required: collect ? (prev[key]?.required ?? false) : false },
    }));
  };

  const setFieldRequired = (
    key: keyof NonNullable<LeadConfig['fields']>,
    required: boolean,
  ) => {
    setFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], required },
    }));
  };

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
                  const fieldCfg = fields[key];
                  const isCollected = fieldCfg?.collect ?? false;
                  const isRequired = fieldCfg?.required ?? false;

                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{FIELD_LABELS[key]}</span>
                        {isCollected && (
                          <div className="flex items-center gap-2 mt-1">
                            <Switch
                              id={`${key}-required`}
                              checked={isRequired}
                              onCheckedChange={(v) => setFieldRequired(key, v)}
                              className="scale-75 origin-left"
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
                      <Switch
                        id={`${key}-collect`}
                        checked={isCollected}
                        onCheckedChange={(v) => setFieldCollect(key, v)}
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Trigger instructions */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="triggerInstructions" className="text-sm font-medium">
              Trigger instructions{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="triggerInstructions"
              placeholder="e.g. Only capture lead if user explicitly asks to be contacted."
              value={triggerInstructions}
              onChange={(e) => setTriggerInstructions(e.target.value)}
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Helps the AI decide when to trigger lead capture.
            </p>
          </div>

          {/* Success message */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="successMessage" className="text-sm font-medium">
              Success message
            </Label>
            <Input
              id="successMessage"
              placeholder="Thanks! We'll be in touch."
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Shown after the agent successfully captures a lead.
            </p>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
