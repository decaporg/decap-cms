import expect from 'expect';
import { Map, OrderedMap, fromJS } from 'immutable';
import { configLoaded } from '../../src/actions/config';
import { entriesLoading, entriesLoaded } from '../../src/actions/entries';
import { collections } from '../../src/reducers/collections';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(
      collections(undefined, {})
    ).toEqual(
      null
    );
  });

  it('should load the collections from the config', () => {
    expect(
      collections(undefined, configLoaded({ collections: [
        { name: 'posts', folder: '_posts', fields: [{ name: 'title', widget: 'string' }] }
      ] }))
    ).toEqual(
      OrderedMap({
        posts: fromJS({ name: 'posts', folder: '_posts', fields: [{ name: 'title', widget: 'string' }] })
      })
    );
  });

  it('should mark entries as loading', () => {
    const state = OrderedMap({
      'posts': Map({ name: 'posts' })
    });
    expect(
      collections(state, entriesLoading(Map({ name: 'posts' })))
    ).toEqual(
      OrderedMap({
        'posts': Map({ name: 'posts', isFetching: true })
      })
    );
  });

  it('should handle loaded entries', () => {
    const state = OrderedMap({
      'posts': Map({ name: 'posts' })
    });
    const entries = [{ slug: 'a', path: '' }, { slug: 'b', title: 'B' }];
    expect(
      collections(state, entriesLoaded(Map({ name: 'posts' }), entries))
    ).toEqual(
      OrderedMap({
        'posts': fromJS({ name: 'posts', entries: entries })
      })
    );
  });
});
