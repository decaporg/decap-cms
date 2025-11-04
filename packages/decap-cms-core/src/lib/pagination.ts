// Pagination utilities for Decap CMS
import type { CmsCollection, CmsConfig, PaginationConfig, Collection } from '../types/redux';

const DEFAULT_PER_PAGE = 100;
const DEFAULT_USER_OPTIONS: number[] = [];

type CollectionLike = CmsCollection | Collection;

/**
 * Check if pagination is enabled for a collection
 * @param collection - The collection to check (CmsCollection or immutable Collection)
 * @param globalConfig - Optional global config
 * @returns true if pagination is enabled
 */
export function isPaginationEnabled(collection: CollectionLike, globalConfig?: CmsConfig): boolean {
  // Handle immutable Collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagination = typeof (collection as any).get === 'function'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (collection as any).get('pagination')
    : (collection as CmsCollection).pagination;
  
  // Check collection-level pagination setting
  if (typeof pagination !== 'undefined') {
    if (typeof pagination === 'boolean') {
      return pagination;
    }
    if (pagination && typeof pagination === 'object') {
      // enabled defaults to true when an object is provided unless explicitly set to false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enabled = (pagination as any).enabled;
      return typeof enabled === 'boolean' ? enabled : true;
    }
    return false;
  }
  
  // Check global pagination setting
  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') {
      return globalConfig.pagination;
    }
    return !!globalConfig.pagination.enabled;
  }
  
  return false;
}

/**
 * Get the pagination configuration for a collection
 * Merges collection-level and global settings with defaults
 * @param collection - The collection (CmsCollection or immutable Collection)
 * @param globalConfig - Optional global config
 * @returns Pagination configuration with all settings
 */
export function getPaginationConfig(collection: CollectionLike, globalConfig?: CmsConfig): PaginationConfig {
  const defaults: PaginationConfig = {
    enabled: false,
    per_page: DEFAULT_PER_PAGE,
    user_options: DEFAULT_USER_OPTIONS,
  };

  // Start with global config if available
  if (globalConfig?.pagination) {
    if (typeof globalConfig.pagination === 'boolean') {
      defaults.enabled = globalConfig.pagination;
    } else {
      defaults.enabled = globalConfig.pagination.enabled ?? defaults.enabled;
      defaults.per_page = globalConfig.pagination.per_page ?? defaults.per_page;
      defaults.user_options = globalConfig.pagination.user_options ?? defaults.user_options;
    }
  }

  // Handle immutable Collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagination = typeof (collection as any).get === 'function'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (collection as any).get('pagination')
    : (collection as CmsCollection).pagination;

  // Override with collection-specific config
  if (pagination === true) {
    // Simple boolean enables pagination with defaults
    return {
      enabled: true,
      per_page: defaults.per_page,
      user_options: defaults.user_options,
    };
  } else if (typeof pagination === 'object' && pagination !== null) {
    // Detailed config overrides defaults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = pagination as any;
    return {
      enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : true,
      per_page: cfg.per_page ?? defaults.per_page,
      user_options: cfg.user_options ?? defaults.user_options,
    };
  }

  // Return defaults (with global config applied if available)
  return defaults;
}
