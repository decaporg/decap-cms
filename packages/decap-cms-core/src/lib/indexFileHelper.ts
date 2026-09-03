import type { EntryMap, Collection } from '../types/redux';

/**
 * Determines if a file slug matches the index file pattern for a collection.
 * @param filePath - The file slug or path to check
 * @param pattern - The regex pattern from the collection's index_file config
 * @param nested - Whether the collection is nested (affects how the slug is extracted)
 * @returns True if the file matches the index file pattern
 */
export function isIndexFile(filePath: string, pattern: string, nested: boolean): boolean {
  const fileSlug = nested ? filePath?.split('/').pop() : filePath;
  return !!(fileSlug && new RegExp(pattern).test(fileSlug));
}

/**
 * Determines if an entry is an index file entry.
 * Checks both the meta.path_type field (set by the backend) and the slug pattern.
 * @param entry - The entry to check
 * @param collection - The collection configuration containing index_file pattern
 * @returns True if the entry is an index file
 */
export function isIndexFileEntry(entry: EntryMap | undefined, collection: Collection): boolean {
  if (!entry) {
    return false;
  }

  const pathType = entry.getIn(['meta', 'path_type']);
  if (pathType === 'index') {
    return true;
  }

  const indexFileConfig = collection.get('index_file');
  if (!indexFileConfig) {
    return false;
  }

  const slug = entry.get('slug') as string;
  const pattern = indexFileConfig.get('pattern') as string;
  const nested = !!collection.get('nested');

  return isIndexFile(slug, pattern, nested);
}
