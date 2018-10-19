import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, { selectAllFields } from '../collections';
import { createEntry } from 'ValueObjects/Entry';

const collection = OrderedMap({
  name: 'posts',
  folder: '_posts',
  fields: fromJS([{ name: 'title', widget: 'string' }]),
  type: 'folder_based_collection',
});

const collection = OrderedMap({
  name: 'posts',
  folder: '_posts',
  fields: fromJS([{ name: 'title', widget: 'string' }]),
  type: 'folder_based_collection',
});

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
    const entry = createEntry('posts', 'slug', '', { data: { title: 'Test entry' } });
    expect(
      selectAllFields(
        collection,
        fromJS({
          ...entry,
          data: {
            title: 'Test entry',
            tag: 'Unknown field value',
          },
        }),
      ),
    ).toEqual(fromJS([{ name: 'title', widget: 'string' }, { name: 'tag', widget: 'hidden' }]));
  });
});
