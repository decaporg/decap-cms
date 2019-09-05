import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, { selectAllowDeletion } from '../collections';
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
});
