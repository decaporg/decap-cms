import { Map } from 'immutable';
/**
 * Type guard to check if an object is an Immutable.js Map
 */
export function isImmutableMap(obj: unknown): boolean {
  return Map.isMap(obj);
}

/**
 * Helper to safely get a value from either an Immutable Map or plain object
 */
export function getValue<T = unknown>(obj: unknown, key: string): T | undefined {
  if (!obj) return undefined;

  if (isImmutableMap(obj)) {
    return (obj as { get: (k: string) => T }).get(key);
  }

  if (typeof obj === 'object' && obj !== null) {
    return (obj as Record<string, unknown>)[key] as T;
  }

  return undefined;
}
