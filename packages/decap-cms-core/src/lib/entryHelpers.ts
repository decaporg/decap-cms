/**
 * Utility functions for working with entries, filters, sorts, and groups
 */

/**
 * Check if any filters are active in the Redux state
 */
export function hasActiveFilters(activeFilters: unknown): boolean {
  if (!activeFilters) return false;

  // Check if it's an Immutable collection with a 'some' method
  if (
    typeof activeFilters === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (activeFilters as any).some === 'function'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (activeFilters as any).some((f: any) => f.get('active') === true);
  }

  return false;
}

/**
 * Check if any groups are active in the Redux state
 */
export function hasActiveGroups(activeGroups: unknown): boolean {
  if (!activeGroups) return false;

  // Check if it's an Immutable collection with a 'some' method
  if (
    typeof activeGroups === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (activeGroups as any).some === 'function'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (activeGroups as any).some((g: any) => g.get('active') === true);
  }

  return false;
}

/**
 * Check if any sorts are active in the Redux state
 */
export function hasActiveSorts(activeSorts: unknown): boolean {
  if (!activeSorts) return false;

  // Check if it's an Immutable collection with a 'size' property
  if (
    typeof activeSorts === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (activeSorts as any).size === 'number'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (activeSorts as any).size > 0;
  }

  return false;
}

/**
 * Get value from a nested field path (e.g., "data.title" or "data.nested.field")
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFieldValue(obj: any, fieldPath: string): unknown {
  const pathParts = fieldPath.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = obj;
  for (const part of pathParts) {
    value = value?.[part];
  }
  return value;
}

/**
 * Extract active filters from Immutable collection into plain array
 */
export interface FilterDefinition {
  pattern: string | RegExp;
  field: string;
}

export function extractActiveFilters(activeFilters: unknown): FilterDefinition[] {
  const filters: FilterDefinition[] = [];

  if (!activeFilters) return filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (activeFilters as any).forEach === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeFilters as any).forEach((f: any) => {
      if (f.get('active') === true) {
        filters.push({
          pattern: f.get('pattern'),
          field: f.get('field'),
        });
      }
    });
  }

  return filters;
}

/**
 * Apply filters to an entry
 */
export function matchesFilters(
  entry: Record<string, unknown> | { data?: Record<string, unknown> },
  filters: FilterDefinition[],
): boolean {
  return filters.every(({ pattern, field }) => {
    const data = ('data' in entry ? entry.data : entry) || {};
    const value = getFieldValue(data as Record<string, unknown>, field);
    return value !== undefined && new RegExp(String(pattern)).test(String(value));
  });
}
