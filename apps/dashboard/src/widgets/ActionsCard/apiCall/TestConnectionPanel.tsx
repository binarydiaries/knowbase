import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { FieldLabel } from '@knowbase/ui/components/field';
import { Input } from '@knowbase/ui/components/input';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { client } from '@/services/client.gen';
import { getErrorMessage } from '@/utils/errorHelper';

type TestApiTriggerResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type ApiCallRequestConfig = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, string>;
};

/**
 * Lets the agent owner fire a real request against the configured API with a
 * sample value, before saving, to confirm the URL/headers/body template work.
 */
export function TestConnectionPanel({
  agentId,
  fieldName,
  resetKey,
  validate,
  getRequestConfig,
}: {
  agentId: string;
  fieldName: string;
  /** Changing this value (e.g. the intent id) clears the test value/result. */
  resetKey: string | undefined;
  /** Validates the relevant form fields; test is blocked if this resolves false. */
  validate: () => Promise<boolean>;
  /** Reads the current (already-parsed) request config from the form. */
  getRequestConfig: () => ApiCallRequestConfig;
}) {
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState<TestApiTriggerResult | null>(
    null,
  );

  useEffect(() => {
    setTestValue('');
    setTestResult(null);
  }, [resetKey]);

  const testMutation = useMutation({
    mutationFn: async () => {
      const valid = await validate();
      if (!valid) {
        throw new Error('Fix the form errors above before testing.');
      }
      const requestConfig = getRequestConfig();

      const res = await client.post({
        url: '/intents/test-api-trigger',
        responseType: 'json',
        body: {
          agentId,
          fieldName,
          testValue,
          ...requestConfig,
        },
      });
      return res.data as TestApiTriggerResult;
    },
    onSuccess: (result) => {
      setTestResult(result);
      if (!result.success) {
        toast.error('Test call failed — see details below.');
      } else {
        toast.success('Test call succeeded.');
      }
    },
    onError: (error) => {
      setTestResult(null);
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <FieldLabel>Test connection</FieldLabel>
      <p className="text-xs text-muted-foreground">
        Enter a sample value for{' '}
        <code className="rounded bg-muted px-1 py-0.5">
          {fieldName || 'fieldName'}
        </code>{' '}
        to send a real test request with that value filled in, so you can
        confirm the URL, headers, and body template all work before saving.
      </p>
      <div className="flex gap-2">
        <Input
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
          placeholder={`Value for ${fieldName || 'fieldName'}, e.g. ORD-1234`}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!testValue.trim() || testMutation.isPending}
          onClick={() => testMutation.mutate()}
        >
          {testMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Test'
          )}
        </Button>
      </div>

      {testResult && (
        <div className="flex flex-col gap-1.5">
          <Badge
            variant="outline"
            className={
              testResult.success
                ? 'self-start text-green-600 border-green-300 bg-green-50'
                : 'self-start text-red-600 border-red-300 bg-red-50'
            }
          >
            {testResult.success ? 'Success' : 'Failed'}
          </Badge>
          {testResult.error && (
            <p className="text-xs text-red-600">{testResult.error}</p>
          )}
          {testResult.data !== undefined && (
            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
