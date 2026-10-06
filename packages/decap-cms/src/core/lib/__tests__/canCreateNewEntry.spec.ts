import { describe, expect, it } from 'vitest';

import { selectCanCreateNewEntry, selectCreatableCollectionNames } from '@/core/lib/canCreateNewEntry';

// decaporg #7451: collection size limit.
describe('selectCanCreateNewEntry', () => {
  function makeState({
    collection = {},
    publishedIds = [] as string[],
    isFetching = false,
    unpublishedSlugs = [] as string[],
    publishMode = 'editorial_workflow',
  }: {
    collection?: Record<string, unknown>,
    publishedIds?: string[] | undefined,
    isFetching?: boolean,
    unpublishedSlugs?: string[],
    publishMode?: string,
  } = {}) {
    return {
      config: { publish_mode: publishMode },
      collections: {
        posts: { name: 'posts', type: 'folder_based_collection', create: true, ...collection },
      },
      entries: {
        pages: { posts: publishedIds === undefined ? { isFetching } : { ids: publishedIds, isFetching } },
      },
      editorialWorkflow: {
        entities: Object.fromEntries(unpublishedSlugs.map(slug => [`posts.${slug}`, { slug }])),
        pages: {},
      },
    };
  }

  it('is false for an unknown collection or one without create', () => {
    expect(selectCanCreateNewEntry(makeState(), 'nope')).toBe(false);
    expect(selectCanCreateNewEntry(makeState({ collection: { create: false } }), 'posts')).toBe(false);
  });

  it('is false for a files collection', () => {
    expect(selectCanCreateNewEntry(makeState({ collection: { type: 'file_based_collection' } }), 'posts')).toBe(false);
  });

  it('is true for a folder collection without a limit', () => {
    expect(selectCanCreateNewEntry(makeState({ publishedIds: ['a', 'b', 'c'] }), 'posts')).toBe(true);
  });

  it('is true below the limit and false once it is reached', () => {
    expect(selectCanCreateNewEntry(makeState({ collection: { limit: 3 }, publishedIds: ['a', 'b'] }), 'posts')).toBe(
      true,
    );
    expect(
      selectCanCreateNewEntry(makeState({ collection: { limit: 2 }, publishedIds: ['a', 'b'] }), 'posts'),
    ).toBe(false);
  });

  it('counts unpublished entries with the editorial workflow, without double counting', () => {
    const state = makeState({ collection: { limit: 3 }, publishedIds: ['a', 'b'], unpublishedSlugs: ['b', 'c'] });
    expect(selectCanCreateNewEntry(state, 'posts')).toBe(false);
  });

  it('ignores unpublished entries without the editorial workflow', () => {
    const state = makeState({
      collection: { limit: 3 },
      publishedIds: ['a', 'b'],
      unpublishedSlugs: ['c'],
      publishMode: 'simple',
    });
    expect(selectCanCreateNewEntry(state, 'posts')).toBe(true);
  });

  it('is false while a limited collection is still loading', () => {
    const state = makeState({ collection: { limit: 3 }, publishedIds: undefined, isFetching: true });
    expect(selectCanCreateNewEntry(state, 'posts')).toBe(false);
  });

  it('lists the collections a new entry can be created in', () => {
    const state = makeState({ collection: { limit: 1 }, publishedIds: ['a'] });
    (state.collections as Record<string, unknown>).pages = {
      name: 'pages',
      type: 'folder_based_collection',
      create: true,
    };
    expect(selectCreatableCollectionNames(state)).toEqual(['pages']);
  });
});
