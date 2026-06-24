/** Substitutes {{key}} placeholders in a string from an entity map. Leaves unknown keys untouched. */
export function interpolate(
  template: string,
  entities: Record<string, string | null>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => entities[key] ?? match,
  );
}

/** Applies `interpolate` to every value in a string record. */
export function interpolateRecord(
  record: Record<string, string> | undefined,
  entities: Record<string, string | null>,
): Record<string, string> | undefined {
  if (!record) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, interpolate(v, entities)]),
  );
}
