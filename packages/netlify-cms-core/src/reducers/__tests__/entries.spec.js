import { Map, OrderedMap, fromJS } from 'immutable';
import * as actions from 'Actions/entries';
import reducer from '../entries';

const initialState = OrderedMap({
  posts: Map({ name: 'posts' }),
});

describe('entries', () => {
  it('should mark entries as fetching', () => {
    expect(reducer(initialState, actions.entriesLoading(Map({ name: 'posts' })))).toEqual(
      OrderedMap(
        fromJS({
          posts: { name: 'posts' },
          pages: {
            posts: { isFetching: true },
          },
        }),
      ),
    );
  });

  it('should handle loaded entries', () => {
    const entries = [{ slug: 'a', path: '' }, { slug: 'b', title: 'B' }];
    expect(
      reducer(initialState, actions.entriesLoaded(Map({ name: 'posts' }), entries, 0)),
    ).toEqual(
      OrderedMap(
        fromJS({
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
        }),
      ),
    );
  });
});
