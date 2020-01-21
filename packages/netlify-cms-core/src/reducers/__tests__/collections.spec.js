import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, {
  selectAllowDeletion,
  selectEntryPath,
  selectEntrySlug,
  getFieldsNames,
} from '../collections';
import { FILES, FOLDER } from 'Constants/collectionTypes';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(collections(undefined, {})).toEqual(null);
  });

  it('should load the collections from the config', () => {
    expect(
      collections(
        undefined,
        configLoaded(
          fromJS({
            collections: [
              {
                name: 'posts',
                folder: '_posts',
                fields: [{ name: 'title', widget: 'string' }],
              },
            ],
          }),
        ),
      ),
    ).toEqual(
      OrderedMap({
        posts: fromJS({
          name: 'posts',
          folder: '_posts',
          fields: [{ name: 'title', widget: 'string' }],
          type: FOLDER,
        }),
      }),
    );
  });

  describe('selectAllowDeletions', () => {
    it('should not allow deletions for file collections', () => {
      expect(
        selectAllowDeletion(
          fromJS({
            name: 'pages',
            type: FILES,
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectEntryPath', () => {
    it('should return path', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'dir1/dir2/slug',
        ),
      ).toBe('posts/dir1/dir2/slug.md');
    });
  });

  describe('selectEntrySlug', () => {
    it('should return slug', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'posts/dir1/dir2/slug.md',
        ),
      ).toBe('dir1/dir2/slug');
    });
  });

  describe('getFieldsNames', () => {
    it('should get flat fields names', () => {
      const collection = fromJS({
        fields: [{ name: 'en' }, { name: 'es' }],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual(['en', 'es']);
    });

    it('should get nested fields names', () => {
      const collection = fromJS({
        fields: [
          { name: 'en', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'es', fields: [{ name: 'title' }, { name: 'body' }] },
        ],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual([
        'en',
        'es',
        'en.title',
        'en.body',
        'es.title',
        'es.body',
      ]);
    });
  });
});
