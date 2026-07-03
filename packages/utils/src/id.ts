/**
 * Deterministic ID generation. Render tree node IDs must be stable for the
 * same input so rendering stays deterministic; random IDs are forbidden in
 * the pipeline.
 */

export interface IdGenerator {
  next(prefix: string): string;
}

export function createIdGenerator(): IdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const count = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, count);
      return `${prefix}-${count}`;
    },
  };
}
