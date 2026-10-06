import { FOLDER } from '@/core/constants/collectionTypes';
import { EDITORIAL_WORKFLOW } from '@/core/constants/publishModes';

import type { CmsCollectionState } from '@/lib/util/index';

/*
 * Reads the root state directly rather than through the reducer slices' own
 * selectors, so it stays usable from any component without dragging those
 * modules (often mocked in component tests) along.
 */
type State = any;

function unpublishedSlugs(state: State, collectionName: string): string[] {
  const entities = state.editorialWorkflow?.entities ?? {};
  return Object.entries(entities)
    .filter(([key]) => key.startsWith(`${collectionName}.`))
    .map(([, entry]) => (entry as { slug?: string } | undefined)?.slug)
    .filter((slug): slug is string => !!slug);
}

/**
 * Whether a new entry can be created in a collection right now: the
 * collection allows creating entries and, for a folder collection with a
 * `limit`, it holds fewer entries than that (published and, with the
 * editorial workflow, unpublished together). While a limited collection's
 * entries are still loading the answer is `false`, so the create action never
 * flashes on. Files collections never allow new entries.
 */
export function selectCanCreateNewEntry(state: State, collectionName: string): boolean {
  const collection = state.collections?.[collectionName] as CmsCollectionState | undefined;
  if (!collection || !collection.create || collection.type !== FOLDER) {
    return false;
  }

  const limit = collection.limit;
  if (limit === undefined || limit === null) {
    return true;
  }

  const page = state.entries?.pages?.[collectionName];
  if (page?.isFetching && !page?.ids?.length) {
    return false;
  }

  const slugs = new Set<string>(page?.ids ?? []);
  if (state.config?.publish_mode === EDITORIAL_WORKFLOW) {
    for (const slug of unpublishedSlugs(state, collectionName)) {
      slugs.add(slug);
    }
  }

  return slugs.size < limit;
}

/** Names of the collections a new entry can be created in right now. */
export function selectCreatableCollectionNames(state: State): string[] {
  return Object.keys(state.collections ?? {}).filter(name => selectCanCreateNewEntry(state, name));
}
