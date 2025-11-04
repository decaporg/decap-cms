
import type { CmsCollection, CmsConfig, PaginationConfig, Collection } from '../types/redux';

const DEFAULT_PER_PAGE = 100;
type CollectionLike = CmsCollection | Collection;

// Helper to read values from plain objects or Immutable Maps
function getCfg<T = unknown>(obj: unknown, key: string): T | undefined {
  if (!obj) return undefined;
    if (typeof obj === 'object' && obj !== null) {
      // Immutable.js Map
      if (typeof (obj as { get?: unknown }).get === 'function') {
        return (obj as { get: (k: string) => T }).get(key);
      }
      // Plain object
      return (obj as Record<string, unknown>)[key] as T;
    }
    return undefined;
}

export function isPaginationEnabled(collection: CollectionLike, globalConfig?: CmsConfig): boolean {
  let pagination: unknown;
  if (typeof collection === 'object' && collection !== null && typeof (collection as { get?: unknown }).get === 'function') {
    pagination = (collection as { get: (k: string) => unknown }).get('pagination');
  } else {
    pagination = (collection as CmsCollection).pagination;
  }

  if (typeof pagination !== 'undefined') {
    if (typeof pagination === 'boolean') return pagination;
    if (pagination && typeof pagination === 'object') {
      const enabled = getCfg<boolean>(pagination, 'enabled');
      return enabled !== false;
    }
    return false;
  }

  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') return globalConfig.pagination;
    if (typeof globalConfig.pagination === 'object') {
      const enabled = getCfg<boolean>(globalConfig.pagination, 'enabled');
      return enabled !== false;
    }
  }
  return false;
}

export function getPaginationConfig(collection: CollectionLike, globalConfig?: CmsConfig): PaginationConfig {
  const defaults: PaginationConfig = {
    enabled: false,
    per_page: DEFAULT_PER_PAGE,
  };

  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') {
      defaults.enabled = globalConfig.pagination;
    } else if (typeof globalConfig.pagination === 'object') {
      const enabled = getCfg<boolean>(globalConfig.pagination, 'enabled');
      defaults.enabled = enabled !== false;
      const perPage = getCfg<number>(globalConfig.pagination, 'per_page');
      defaults.per_page = typeof perPage === 'number' ? perPage : defaults.per_page;
    }
  }

  let pagination: unknown;
  if (typeof collection === 'object' && collection !== null && typeof (collection as { get?: unknown }).get === 'function') {
    pagination = (collection as { get: (k: string) => unknown }).get('pagination');
  } else {
    pagination = (collection as CmsCollection).pagination;
  }

  if (pagination === true) {
    return {
      enabled: true,
      per_page: defaults.per_page,
    };
  } else if (typeof pagination === 'object' && pagination !== null) {
    const perPage = getCfg<number>(pagination, 'per_page');
    const enabled = getCfg<boolean>(pagination, 'enabled');
    return {
      enabled: enabled !== false,
      per_page: typeof perPage === 'number' ? perPage : defaults.per_page,
    };
  }
  return defaults;
}
