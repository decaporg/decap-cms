// Pagination utilities for Decap CMS
import type { CmsCollection, CmsConfig, PaginationConfig } from '../types/redux';

const DEFAULT_PER_PAGE = 100;
const DEFAULT_USER_OPTIONS = [25, 50, 100, 250, 500];

/**
 * Check if pagination is enabled for a collection
 * @param collection - The collection to check
 * @param globalConfig - Optional global config
 * @returns true if pagination is enabled
 */
export function isPaginationEnabled(collection: CmsCollection, globalConfig?: CmsConfig): boolean {
  // Check collection-level pagination setting
  if (typeof collection.pagination !== 'undefined') {
    return !!collection.pagination;
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
 * @param collection - The collection
 * @param globalConfig - Optional global config
 * @returns Pagination configuration with all settings
 */
export function getPaginationConfig(collection: CmsCollection, globalConfig?: CmsConfig): PaginationConfig {
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

  // Override with collection-specific config
  if (collection.pagination === true) {
    // Simple boolean enables pagination with defaults
    return {
      enabled: true,
      per_page: defaults.per_page,
      user_options: defaults.user_options,
    };
  } else if (typeof collection.pagination === 'object') {
    // Detailed config overrides defaults
    return {
      enabled: true,
      per_page: collection.pagination.per_page ?? defaults.per_page,
      user_options: collection.pagination.user_options ?? defaults.user_options,
    };
  }

  // Return defaults (with global config applied if available)
  return defaults;
}
