import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const OTEL_EXPORTER_URL =
  process.env.OTEL_EXPORTER_URL ??
  'https://otel-collector.agenvik.com/v1/traces';

/** Shared span processor so server.ts and worker.ts export to the same collector. */
export function createOtelSpanProcessor() {
  return new BatchSpanProcessor(
    new OTLPTraceExporter({ url: OTEL_EXPORTER_URL }),
  );
}

/** Distinct service.name per process so traces are filterable in the collector UI. */
export function createOtelResource(serviceName: string) {
  return resourceFromAttributes({ 'service.name': serviceName });
}
