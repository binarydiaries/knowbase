import { type Span, SpanStatusCode, trace } from '@opentelemetry/api';

export const tracer = trace.getTracer('agenvik-backend');

/** Runs `fn` inside a span, recording exceptions and always ending the span. */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await fn(span);
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}
