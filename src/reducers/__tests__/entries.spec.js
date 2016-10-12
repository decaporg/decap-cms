import Immutable, { Map, OrderedMap, fromJS } from 'immutable';
import * as actions from '../../actions/entries';
import reducer from '../entries';

let initialState;

describe('entries', () => {
  it('should mark entries as fetching', () => {
    const state = OrderedMap({
      posts: Map({ name: 'posts' }),
    });
    expect(
      reducer(state, actions.entriesLoading(Map({ name: 'posts' })))
    ).toEqual(
      OrderedMap(fromJS({
        posts: { name: 'posts' },
        pages: {
          posts: { isFetching: true },
        },
      }))
    );
  });

  it('should handle loaded entries', () => {
    const state = OrderedMap({
      posts: Map({ name: 'posts' }),
    });
    const entries = [{ slug: 'a', path: '' }, { slug: 'b', title: 'B' }];
    expect(
      reducer(state, actions.entriesLoaded(Map({ name: 'posts' }), entries, 0))
    ).toEqual(
      OrderedMap(fromJS(
        {
          posts: { name: 'posts' },
          entities: {
            'posts.a': { slug: 'a', path: '', isFetching: false },
            'posts.b': { slug: 'b', title: 'B', isFetching: false },
          },
          pages: {
            posts: {
              page: 0,
              ids: ['a', 'b'],
            },
          },
        }
      ))
    );
  });

  describe('entry persisting', () => {
    beforeEach(() => {
      initialState = Immutable.fromJS({
        entities: {
          'posts.slug': {
            collection: 'posts',
            slug: 'slug',
            path: 'content/blog/art-and-wine-festival.md',
            partial: false,
            raw: '',
            data: {},
            metaData: null,
          },
        },
        pages: {},
      });
    });

    it('should handle persisting request', () => {
      const newState = reducer(
        initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' }))
      );
      expect(newState.getIn(['entities', 'posts.slug', 'isPersisting'])).toBe(true);
    });

    it('should handle persisting success', () => {
      let newState = reducer(initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' }))
      );
      newState = reducer(newState,
        actions.entryPersisted(Map({ name: 'posts' }), Map({ slug: 'slug' }))
      );
      expect(newState.getIn(['entities', 'posts.slug', 'isPersisting'])).toBeUndefined();
    });

    it('should handle persisting error', () => {
      let newState = reducer(initialState,
        actions.entryPersisting(Map({ name: 'posts' }), Map({ slug: 'slug' }))
      );
      newState = reducer(newState,
        actions.entryPersistFail(Map({ name: 'posts' }), Map({ slug: 'slug' }), 'Error message')
      );
      expect(newState.getIn(['entities', 'posts.slug', 'isPersisting'])).toBeUndefined();
    });
  });
});
