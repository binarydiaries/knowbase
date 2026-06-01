import type { ActionContext } from '../graph/nodes/execute-actions.js';
import type { ActionResult } from '../graph/state.js';

type ApiTriggerConfig = {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, string>;
  responseInstructions?: string;
};

/** Replaces {{variableName}} placeholders with values from entities or prior results */
function resolveTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export async function executeApiTrigger(
  config: Record<string, unknown>,
  ctx: ActionContext,
  priorResults: Record<string, ActionResult>,
): Promise<ActionResult> {
  const cfg = config as ApiTriggerConfig;

  if (!cfg.url) {
    return { success: false, error: 'api_trigger: url is required' };
  }

  const vars: Record<string, unknown> = {
    ...ctx.entities,
    ...Object.fromEntries(
      Object.entries(priorResults).flatMap(([id, r]) =>
        r.success && r.data ? Object.entries(r.data as Record<string, unknown>).map(([k, v]) => [`${id}_${k}`, v]) : [],
      ),
    ),
  };

  const url = resolveTemplate(cfg.url, vars);
  const method = cfg.method ?? 'POST';

  // Resolve body template
  const body = cfg.bodyTemplate
    ? JSON.stringify(
        Object.fromEntries(
          Object.entries(cfg.bodyTemplate).map(([k, v]) => [k, resolveTemplate(v, vars)]),
        ),
      )
    : undefined;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.headers ?? {}),
      },
      ...(body ? { body } : {}),
    });

    const responseText = await res.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${responseText.slice(0, 200)}`,
        data: responseData,
      };
    }

    return {
      success: true,
      data: {
        response: responseData,
        responseInstructions: cfg.responseInstructions,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'api_trigger: fetch failed',
    };
  }
}
