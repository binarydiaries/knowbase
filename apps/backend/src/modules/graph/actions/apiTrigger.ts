import { assertSafeUrl } from '../../../utils/ssrfGuard.utils';
import {
  interpolate,
  interpolateRecord,
} from '../../../utils/templating.utils';
import { ApiTriggerConfigSchema } from '../../intent/model';
import type { ActionContext, IActionResult } from './types';

const REQUEST_TIMEOUT_MS = 8000;

// Hard cap on the raw response body. Kept small because every byte here can
// end up inside an LLM prompt (see executeActions' phraseApiTriggerResponse) —
// an oversized customer API response would otherwise translate directly into
// runaway LLM token cost.
const MAX_RESPONSE_BYTES = 20_000;

export async function apiTrigger(ctx: ActionContext): Promise<IActionResult> {
  const parsed = ApiTriggerConfigSchema.safeParse(ctx.config);
  if (!parsed.success) {
    return { success: false, error: 'api_trigger: invalid action config' };
  }
  const { method, url, headers, bodyTemplate } = parsed.data;

  const entities = ctx.entities ?? {};
  const interpolatedUrl = interpolate(url, entities);
  const interpolatedBody = interpolateRecord(bodyTemplate, entities);

  try {
    await assertSafeUrl(interpolatedUrl);
  } catch (err) {
    return {
      success: false,
      error: `api_trigger: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    const response = await fetch(interpolatedUrl, {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
        ...(method !== 'GET' && interpolatedBody
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body:
        method !== 'GET' && interpolatedBody
          ? JSON.stringify(interpolatedBody)
          : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    });

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      return { success: false, error: 'api_trigger: response too large' };
    }

    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON response — pass the raw text through.
    }

    if (!response.ok) {
      return {
        success: false,
        data,
        error: `api_trigger: request failed with status ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? `api_trigger: ${err.message}`
          : 'api_trigger: request failed',
    };
  }
}
