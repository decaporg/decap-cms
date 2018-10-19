import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, { selectFields } from '../collections';

const entry = {
  collection: 'posts',
  slug: 'slug',
  path: '',
  partial: false,
  raw: '',
  data: {
    title: 'Test entry',
    tag: 'Unkown field value'
  },
  metaData: null,
};

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
          type: 'folder_based_collection',
        }),
      }),
    );
  });

  it('should inject unknown fields from an entry as hidden fields', () => {
    const collection = collections(
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
    );
    expect(
      selectFields(
        collection,
        '',
        fromJS(entry)
      )
    ).toEqual(
      fromJS([{ name: 'title', widget: 'string' }, { name: 'tag', widget: 'hidden' }]),
    );
  });
});
