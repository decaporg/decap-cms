import expect from 'expect';
import Immutable from 'immutable';
import { configLoaded } from '../../src/actions/config';
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
      collections(undefined, configLoaded({collections: [
        {name: 'posts', folder: '_posts', fields: [{name: 'title', widget: 'string'}]}
      ]}))
    ).toEqual(
      Immutable.OrderedMap({
        posts: Immutable.fromJS({name: 'posts', folder: '_posts', fields: [{name: 'title', widget: 'string'}]})
      })
    );
  });
});
