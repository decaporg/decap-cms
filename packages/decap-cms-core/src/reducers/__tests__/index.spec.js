import { Map, fromJS } from 'immutable';

import { FOLDER } from '../../constants/collectionTypes';
import { selectCanCreateNewEntry } from '../index';

describe('reducers', () => {
  describe('selectCanCreateNewEntry', () => {
    it('counts all loaded entries instead of the active filtered view', () => {
      const collection = fromJS({
        name: 'posts',
        type: FOLDER,
        create: true,
        limit: 3,
      });
      const state = {
        collections: Map({ posts: collection }),
        entries: fromJS({
          entities: {
            'posts.one': { slug: 'one', data: { category: 'news' } },
            'posts.two': { slug: 'two', data: { category: 'docs' } },
            'posts.three': { slug: 'three', data: { category: 'docs' } },
          },
          pages: {
            posts: {
              ids: ['one', 'two', 'three'],
            },
          },
          filter: {
            posts: {
              category: {
                active: true,
                field: 'category',
                pattern: 'news',
              },
            },
          },
        }),
      };

      expect(selectCanCreateNewEntry(state, 'posts')).toBe(false);
    });
  });
});
