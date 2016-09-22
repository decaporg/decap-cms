import expect from 'expect';
import { Map, OrderedMap, fromJS } from 'immutable';
import { entriesLoading, entriesLoaded } from '../../actions/entries';
import reducer from '../entries';

describe('entries', () => {
  it('should mark entries as fetching', () => {
    const state = OrderedMap({
      'posts': Map({ name: 'posts' })
    });
    expect(
      reducer(state, entriesLoading(Map({ name: 'posts' })))
    ).toEqual(
      OrderedMap(fromJS({
        'posts': { name: 'posts' },
        'pages': {
          'posts': { isFetching: true }
        }
      }))
    );
  });

  it('should handle loaded entries', () => {
    const state = OrderedMap({
      'posts': Map({ name: 'posts' })
    });
    const entries = [{ slug: 'a', path: '' }, { slug: 'b', title: 'B' }];
    expect(
      reducer(state, entriesLoaded(Map({ name: 'posts' }), entries))
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
              ids: ['a', 'b']
            }
          }
        }
      ))
    );
  });
});
