import { fromJS } from 'immutable';

import { isIndexFile, isIndexFileEntry } from '../indexFileHelper';

import type { Collection, EntryMap } from '../../types/redux';

describe('indexFileHelper', () => {
  describe('isIndexFile', () => {
    describe('flat (non-nested) collections', () => {
      it('should match a simple index file pattern', () => {
        expect(isIndexFile('_index', '^_index$', false)).toBe(true);
      });

      it('should not match a non-index slug', () => {
        expect(isIndexFile('my-post', '^_index$', false)).toBe(false);
      });

      it('should match a pattern with partial regex', () => {
        expect(isIndexFile('_index', '_index', false)).toBe(true);
      });

      it('should match a slug containing the pattern', () => {
        expect(isIndexFile('foo_index', '_index', false)).toBe(true);
      });

      it('should not match when pattern is anchored and slug differs', () => {
        expect(isIndexFile('foo_index', '^_index$', false)).toBe(false);
      });

      it('should handle empty slug', () => {
        expect(isIndexFile('', '^_index$', false)).toBe(false);
      });

      it('should handle empty pattern (matches any non-empty string)', () => {
        expect(isIndexFile('anything', '', false)).toBe(true);
      });

      it('should match index pattern with different naming conventions', () => {
        expect(isIndexFile('index', '^index$', false)).toBe(true);
        expect(isIndexFile('_index', '^_index$', false)).toBe(true);
        expect(isIndexFile('INDEX', '^INDEX$', false)).toBe(true);
      });

      it('should handle regex special characters in slug safely', () => {
        // The slug contains special regex chars but the pattern is plain
        expect(isIndexFile('file.name', 'file\\.name', false)).toBe(true);
        expect(isIndexFile('file-name', 'file\\.name', false)).toBe(false);
      });

      it('should handle complex regex patterns', () => {
        expect(isIndexFile('_index', '^_?index$', false)).toBe(true);
        expect(isIndexFile('index', '^_?index$', false)).toBe(true);
        expect(isIndexFile('__index', '^_?index$', false)).toBe(false);
      });
    });

    describe('nested collections', () => {
      it('should extract the last path segment and match', () => {
        expect(isIndexFile('about/team/index', '^index$', true)).toBe(true);
      });

      it('should match a single-segment path in nested mode', () => {
        expect(isIndexFile('index', '^index$', true)).toBe(true);
      });

      it('should not match when last segment does not match pattern', () => {
        expect(isIndexFile('about/team/page', '^index$', true)).toBe(false);
      });

      it('should handle deeply nested paths', () => {
        expect(isIndexFile('a/b/c/d/e/_index', '^_index$', true)).toBe(true);
      });

      it('should handle empty slug in nested mode', () => {
        expect(isIndexFile('', '^index$', true)).toBe(false);
      });

      it('should only check the last segment, not intermediate ones', () => {
        // Path has "index" in the middle but not at the end
        expect(isIndexFile('index/about/page', '^index$', true)).toBe(false);
      });
    });
  });

  describe('isIndexFileEntry', () => {
    function makeEntry(overrides: Record<string, unknown> = {}): EntryMap {
      return fromJS({
        slug: 'my-post',
        meta: {},
        data: {},
        ...overrides,
      }) as EntryMap;
    }

    function makeCollection(overrides: Record<string, unknown> = {}): Collection {
      return fromJS({
        name: 'posts',
        type: 'folder_based_collection',
        folder: '_posts',
        fields: [{ name: 'title', widget: 'string' }],
        ...overrides,
      }) as Collection;
    }

    it('should return false for undefined entry', () => {
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
      });
      expect(isIndexFileEntry(undefined, collection)).toBe(false);
    });

    it('should return true when meta.path_type is "index"', () => {
      const entry = makeEntry({
        slug: 'whatever',
        meta: { path_type: 'index' },
      });
      const collection = makeCollection(); // no index_file config needed
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should return false when meta.path_type is "slug" and no index_file config', () => {
      const entry = makeEntry({
        slug: '_index',
        meta: { path_type: 'slug' },
      });
      const collection = makeCollection(); // no index_file config
      expect(isIndexFileEntry(entry, collection)).toBe(false);
    });

    it('should fall back to slug pattern matching when no path_type meta', () => {
      const entry = makeEntry({
        slug: '_index',
        meta: {},
      });
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should return false when slug does not match pattern and no path_type', () => {
      const entry = makeEntry({
        slug: 'regular-post',
        meta: {},
      });
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(false);
    });

    it('should handle nested collection slug matching', () => {
      const entry = makeEntry({
        slug: 'about/team/index',
        meta: {},
      });
      const collection = makeCollection({
        nested: { depth: 100 },
        index_file: { pattern: '^index$' },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should return false for nested collection when last segment does not match', () => {
      const entry = makeEntry({
        slug: 'about/team/page',
        meta: {},
      });
      const collection = makeCollection({
        nested: { depth: 100 },
        index_file: { pattern: '^index$' },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(false);
    });

    it('should prioritize path_type over slug pattern matching', () => {
      // Entry slug matches the pattern, but path_type says "index" — should be true
      const entry = makeEntry({
        slug: 'not-an-index',
        meta: { path_type: 'index' },
      });
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should return false when path_type is "slug" even if slug matches pattern', () => {
      // path_type is "slug" (not "index"), so the shortcut doesn't trigger,
      // but the slug pattern matching still runs as a fallback
      const entry = makeEntry({
        slug: '_index',
        meta: { path_type: 'slug' },
      });
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
      });
      // path_type "slug" does not short-circuit to false — it falls through to pattern matching
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should handle collection with index_file but no fields', () => {
      const entry = makeEntry({
        slug: '_index',
        meta: {},
      });
      const collection = makeCollection({
        index_file: { pattern: '^_index$' },
        // no 'fields' key on index_file
      });
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });

    it('should handle index_file config with fields and editor', () => {
      const entry = makeEntry({
        slug: '_index',
        meta: {},
      });
      const collection = makeCollection({
        index_file: {
          pattern: '^_index$',
          fields: [{ name: 'title', widget: 'string' }],
          editor: { preview: false },
        },
      });
      expect(isIndexFileEntry(entry, collection)).toBe(true);
    });
  });
});
