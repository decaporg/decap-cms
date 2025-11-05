import { getValue, isImmutableMap } from './immutableHelpers';

import type { CmsCollection, CmsConfig, PaginationConfig, Collection } from '../types/redux';

const DEFAULT_PER_PAGE = 100;
type CollectionLike = CmsCollection | Collection;

export function isPaginationEnabled(collection: CollectionLike, globalConfig?: CmsConfig): boolean {
  const pagination = isImmutableMap(collection)
    ? (collection as { get: (k: string) => unknown }).get('pagination')
    : (collection as CmsCollection).pagination;

  if (typeof pagination !== 'undefined') {
    if (typeof pagination === 'boolean') return pagination;
    if (pagination && typeof pagination === 'object') {
      const enabled = getValue<boolean>(pagination, 'enabled');
      return enabled !== false;
    }
    return false;
  }

  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') return globalConfig.pagination;
    if (typeof globalConfig.pagination === 'object') {
      const enabled = getValue<boolean>(globalConfig.pagination, 'enabled');
      return enabled !== false;
    }
  }
  return false;
}

export function getPaginationConfig(
  collection: CollectionLike,
  globalConfig?: CmsConfig,
): PaginationConfig {
  const defaults: PaginationConfig = {
    enabled: false,
    per_page: DEFAULT_PER_PAGE,
  };

  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') {
      defaults.enabled = globalConfig.pagination;
    } else if (typeof globalConfig.pagination === 'object') {
      const enabled = getValue<boolean>(globalConfig.pagination, 'enabled');
      defaults.enabled = enabled !== false;
      const perPage = getValue<number>(globalConfig.pagination, 'per_page');
      defaults.per_page = typeof perPage === 'number' ? perPage : defaults.per_page;
    }
  }

  const pagination = isImmutableMap(collection)
    ? (collection as { get: (k: string) => unknown }).get('pagination')
    : (collection as CmsCollection).pagination;

  if (pagination === true) {
    return {
      enabled: true,
      per_page: defaults.per_page,
    };
  } else if (typeof pagination === 'object' && pagination !== null) {
    const perPage = getValue<number>(pagination, 'per_page');
    const enabled = getValue<boolean>(pagination, 'enabled');
    return {
      enabled: enabled !== false,
      per_page: typeof perPage === 'number' ? perPage : defaults.per_page,
    };
  }
  return defaults;
}
