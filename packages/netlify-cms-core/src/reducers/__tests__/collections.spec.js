import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, { selectAllowDeletion, selectEntryPath, selectEntrySlug } from '../collections';
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
    it('should return path when content_in_sub_folders is false', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            content_in_sub_folders: false,
            folder: 'posts',
          }),
          'slug',
        ),
      ).toBe('posts/slug.md');
    });

    it('should return decoded path when content_in_sub_folders is true', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            content_in_sub_folders: true,
            folder: 'posts',
          }),
          encodeURIComponent('dir1/dir2/slug'),
        ),
      ).toBe('posts/dir1/dir2/slug.md');
    });
  });

  describe('selectEntrySlug', () => {
    it('should return slug when content_in_sub_folders is false', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            content_in_sub_folders: false,
            folder: 'posts',
          }),
          'posts/slug.md',
        ),
      ).toBe('slug');
    });

    it('should return decoded path when content_in_sub_folders is true', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            content_in_sub_folders: true,
            folder: 'posts',
          }),
          'posts/dir1/dir2/slug.md',
        ),
      ).toBe(encodeURIComponent('dir1/dir2/slug'));
    });
  });
});
