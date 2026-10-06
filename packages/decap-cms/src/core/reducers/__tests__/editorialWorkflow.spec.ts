import { describe, expect, it } from 'vitest';

import {
  UNPUBLISHED_ENTRIES_FAILURE,
  UNPUBLISHED_ENTRIES_REQUEST,
  UNPUBLISHED_ENTRIES_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS,
  UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS,
} from '@/core/actions/editorialWorkflow';
import { status as statusValues } from '@/core/constants/publishModes';
import unpublishedEntries, {
  selectUnpublishedEntriesByStatus,
  selectUnpublishedEntriesGroupedByStatus,
  selectUnpublishedEntry,
  selectUnpublishedSlugs,
} from '@/core/reducers/editorialWorkflow';

import type { EditorialWorkflow } from '@/core/reducers/editorialWorkflow';

describe('unpublishedEntries reducer', () => {
  it('should return the default state on an empty action', () => {
    const result = unpublishedEntries(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual({ entities: {}, pages: {} });
  });

  describe('UNPUBLISHED_ENTRIES_FAILURE', () => {
    it('clears the fetching flag so the board stops loading and a retry can run', () => {
      const loading = unpublishedEntries(undefined, { type: UNPUBLISHED_ENTRIES_REQUEST });
      expect(loading.pages.isFetching).toBe(true);

      const failed = unpublishedEntries(loading, {
        type: UNPUBLISHED_ENTRIES_FAILURE,
        payload: new Error('network'),
      });
      expect(failed.pages.isFetching).toBe(false);
    });
  });

  describe('UNPUBLISHED_ENTRIES_SUCCESS', () => {
    it('should set entities keyed by collection.slug and store page ids', () => {
      const entries = [
        { collection: 'posts', slug: 'first-post', status: 'draft' },
        { collection: 'posts', slug: 'second-post', status: 'pending_review' },
      ];

      const result = unpublishedEntries(undefined, {
        type: UNPUBLISHED_ENTRIES_SUCCESS,
        payload: {
          entries,
          pages: { count: 2 },
        },
      });

      expect(result.entities).toEqual({
        'posts.first-post': { ...entries[0], isFetching: false },
        'posts.second-post': { ...entries[1], isFetching: false },
      });
      expect(result.pages).toEqual({
        count: 2,
        ids: ['first-post', 'second-post'],
      });
    });

    it('should overwrite previous entities and pages', () => {
      const initialState = {
        entities: {
          'posts.stale-post': { collection: 'posts', slug: 'stale-post' },
        },
        pages: { isFetching: true },
      };

      const entries = [{ collection: 'posts', slug: 'fresh-post', status: 'draft' }];

      const result = unpublishedEntries(initialState, {
        type: UNPUBLISHED_ENTRIES_SUCCESS,
        payload: {
          entries,
          pages: {},
        },
      });

      expect(result.entities).toEqual({
        'posts.stale-post': { collection: 'posts', slug: 'stale-post' },
        'posts.fresh-post': { ...entries[0], isFetching: false },
      });
      expect(result.pages).toEqual({ ids: ['fresh-post'] });
    });
  });

  describe('selectUnpublishedEntry', () => {
    const state: EditorialWorkflow = {
      entities: {
        'posts.first-post': { collection: 'posts', slug: 'first-post', status: 'draft' },
      },
      pages: {},
    };

    it('should return the entry when found', () => {
      expect(selectUnpublishedEntry(state, 'posts', 'first-post')).toEqual(
        state.entities['posts.first-post'],
      );
    });

    it('should return undefined when the entry is not found', () => {
      expect(selectUnpublishedEntry(state, 'posts', 'missing-post')).toBeUndefined();
    });
  });

  describe('selectUnpublishedEntriesByStatus', () => {
    const state: EditorialWorkflow = {
      entities: {
        'posts.first-post': { collection: 'posts', slug: 'first-post', status: 'draft' },
        'posts.second-post': {
          collection: 'posts',
          slug: 'second-post',
          status: 'pending_review',
        },
        'posts.third-post': { collection: 'posts', slug: 'third-post', status: 'draft' },
      },
      pages: {},
    };

    it('should return only entries matching the given status', () => {
      expect(selectUnpublishedEntriesByStatus(state, 'draft')).toEqual([
        state.entities['posts.first-post'],
        state.entities['posts.third-post'],
      ]);
    });

    it('should return an empty array when no entries match the status', () => {
      expect(selectUnpublishedEntriesByStatus(state, 'pending_publish')).toEqual([]);
    });
  });

  describe('selectUnpublishedEntriesGroupedByStatus', () => {
    it('should group entries by every known status', () => {
      const state: EditorialWorkflow = {
        entities: {
          'posts.first-post': { collection: 'posts', slug: 'first-post', status: 'draft' },
          'posts.second-post': {
            collection: 'posts',
            slug: 'second-post',
            status: 'pending_review',
          },
        },
        pages: {},
      };

      const result = selectUnpublishedEntriesGroupedByStatus(state);

      expect(result).toEqual({
        [statusValues.DRAFT]: [state.entities['posts.first-post']],
        [statusValues.PENDING_REVIEW]: [state.entities['posts.second-post']],
        [statusValues.PENDING_PUBLISH]: [],
      });
    });

    it('should return empty arrays for every status when there are no entities', () => {
      const state: EditorialWorkflow = { entities: {}, pages: {} };

      const result = selectUnpublishedEntriesGroupedByStatus(state);

      expect(result).toEqual({
        [statusValues.DRAFT]: [],
        [statusValues.PENDING_REVIEW]: [],
        [statusValues.PENDING_PUBLISH]: [],
      });
    });
  });

  describe('selectUnpublishedSlugs', () => {
    const state: EditorialWorkflow = {
      entities: {
        'posts.first-post': { collection: 'posts', slug: 'first-post', status: 'draft' },
        'posts.second-post': {
          collection: 'posts',
          slug: 'second-post',
          status: 'pending_review',
        },
        'pages.about': { collection: 'pages', slug: 'about', status: 'draft' },
      },
      pages: {},
    };

    it('should return the slugs for entries belonging to the given collection', () => {
      expect(selectUnpublishedSlugs(state, 'posts')).toEqual(['first-post', 'second-post']);
    });

    it('should return an empty array when no entities match the collection', () => {
      expect(selectUnpublishedSlugs(state, 'videos')).toEqual([]);
    });

    it('should return null when state has no entities', () => {
      expect(
        selectUnpublishedSlugs({ entities: undefined } as unknown as EditorialWorkflow, 'posts'),
      ).toBeNull();
    });
  });

  describe('UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS', () => {
    it('sets publishAt on the matching entity', () => {
      const initialState: EditorialWorkflow = {
        entities: {
          'posts.my-post': { collection: 'posts', slug: 'my-post', status: 'pending_publish' },
        },
        pages: {},
      };

      const result = unpublishedEntries(initialState, {
        type: UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS,
        payload: { collection: 'posts', slug: 'my-post', publishAt: '2026-09-01T00:00:00.000Z' },
      });

      expect(result.entities['posts.my-post']).toEqual({
        collection: 'posts',
        slug: 'my-post',
        status: 'pending_publish',
        publishAt: '2026-09-01T00:00:00.000Z',
      });
    });

    it('is a no-op when the entity is not loaded', () => {
      const initialState: EditorialWorkflow = { entities: {}, pages: {} };

      const result = unpublishedEntries(initialState, {
        type: UNPUBLISHED_ENTRY_PUBLISH_SCHEDULE_SUCCESS,
        payload: { collection: 'posts', slug: 'missing', publishAt: '2026-09-01T00:00:00.000Z' },
      });

      expect(result.entities).toEqual({});
    });
  });

  describe('UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS', () => {
    it('removes publishAt from the matching entity', () => {
      const initialState: EditorialWorkflow = {
        entities: {
          'posts.my-post': {
            collection: 'posts',
            slug: 'my-post',
            status: 'pending_publish',
            publishAt: '2026-09-01T00:00:00.000Z',
          },
        },
        pages: {},
      };

      const result = unpublishedEntries(initialState, {
        type: UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS,
        payload: { collection: 'posts', slug: 'my-post' },
      });

      expect(result.entities['posts.my-post']).toEqual({
        collection: 'posts',
        slug: 'my-post',
        status: 'pending_publish',
      });
      expect(result.entities['posts.my-post']).not.toHaveProperty('publishAt');
    });

    it('is a no-op when the entity is not loaded', () => {
      const initialState: EditorialWorkflow = { entities: {}, pages: {} };

      const result = unpublishedEntries(initialState, {
        type: UNPUBLISHED_ENTRY_PUBLISH_UNSCHEDULE_SUCCESS,
        payload: { collection: 'posts', slug: 'missing' },
      });

      expect(result.entities).toEqual({});
    });
  });
});
