import { z } from 'zod';
import type { IntentRow } from '../types';
import { API_CALL_INTENT, DEFAULT_FAILURE, DEFAULT_TRIGGER } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiTriggerConfig = {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, string>;
  responseInstructions?: string;
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

export const apiCallFormSchema = z.object({
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

export type ApiCallFormValues = z.infer<typeof apiCallFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function apiCallDefaultValues(): ApiCallFormValues {
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

export function apiCallIntentToFormValues(
  intent: IntentRow,
): ApiCallFormValues {
  const action = intent.actions.find((a) => a.actionType === 'api_trigger');
  const config = (action?.config as ApiTriggerConfig | undefined) ?? {};
  return {
    triggerInstructions: intent.triggerInstructions || DEFAULT_TRIGGER,
    fieldName: intent.requiredFields[0] ?? 'orderNumber',
    method: (config.method as ApiCallFormValues['method']) ?? 'GET',
    url: config.url ?? '',
    headers: config.headers ? JSON.stringify(config.headers, null, 2) : '',
    bodyTemplate: config.bodyTemplate
      ? JSON.stringify(config.bodyTemplate, null, 2)
      : '',
    responseInstructions: config.responseInstructions ?? '',
    failureMessage: intent.config?.failure ?? DEFAULT_FAILURE,
  };
}

export function apiCallFormValuesToIntentPayload(
  values: ApiCallFormValues,
  agentId: string,
) {
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

/** Parses the raw header/bodyTemplate JSON text fields into objects for sending over the wire. */
export function parseApiCallJsonFields(values: ApiCallFormValues) {
  return {
    headers: values.headers?.trim()
      ? (JSON.parse(values.headers) as Record<string, string>)
      : undefined,
    bodyTemplate: values.bodyTemplate?.trim()
      ? (JSON.parse(values.bodyTemplate) as Record<string, string>)
      : undefined,
  };
}
