import { Map, fromJS } from 'immutable';

import { FOLDER } from '../../constants/collectionTypes';
import { EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import { selectCanCreateNewEntry } from '../index';

describe('reducers', () => {
  describe('selectCanCreateNewEntry', () => {
    it('allows limited folder collection creation before entries load', () => {
      const collection = fromJS({
        name: 'posts',
        type: FOLDER,
        create: true,
        limit: 3,
      });
      const state = {
        collections: Map({ posts: collection }),
        entries: fromJS({
          pages: {},
        }),
      };

      expect(selectCanCreateNewEntry(state, 'posts')).toBe(true);
    });

    it('does not allow limited folder collection creation while entries are loading', () => {
      const collection = fromJS({
        name: 'posts',
        type: FOLDER,
        create: true,
        limit: 3,
      });
      const state = {
        collections: Map({ posts: collection }),
        entries: fromJS({
          pages: {
            posts: {
              isFetching: true,
            },
          },
        }),
      };

      expect(selectCanCreateNewEntry(state, 'posts')).toBe(false);
    });

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

    it('counts unpublished workflow entries against collection limits', () => {
      const collection = fromJS({
        name: 'posts',
        type: FOLDER,
        create: true,
        limit: 3,
      });
      const state = {
        config: {
          publish_mode: EDITORIAL_WORKFLOW,
        },
        collections: Map({ posts: collection }),
        entries: fromJS({
          pages: {
            posts: {
              ids: ['one', 'two'],
            },
          },
        }),
        editorialWorkflow: fromJS({
          entities: {
            'posts.three': { slug: 'three' },
          },
          pages: {
            ids: ['three'],
          },
        }),
      };

      expect(selectCanCreateNewEntry(state, 'posts')).toBe(false);
    });
  });
});
