import { fromJS } from 'immutable';

import editorialWorkflow from '../editorialWorkflow';

describe('editorialWorkflow', () => {
  it('stops loading unpublished entries after a failure', () => {
    const state = fromJS({ pages: { isFetching: true } });
    const action = { type: 'UNPUBLISHED_ENTRIES_FAILURE' };

    expect(editorialWorkflow(state, action).getIn(['pages', 'isFetching'])).toBe(false);
  });

  // `pages.keys` is what loadUnpublishedEntry reads to decide whether a slug is
  // under editorial workflow, and `pages.loadedAt` is what bounds how old that
  // answer may be. Everything below is about keeping those two honest.
  describe('workflow keys', () => {
    it('records the keys and when they were confirmed, from the entries themselves', () => {
      const action = {
        type: 'UNPUBLISHED_ENTRIES_SUCCESS',
        payload: {
          pages: {},
          entries: [
            { collection: 'posts', slug: 'one' },
            { collection: 'authors', slug: 'someone' },
          ],
        },
      };

      const pages = editorialWorkflow(fromJS({}), action).get('pages');

      expect(pages.get('keys').toJS()).toEqual(['posts/one', 'authors/someone']);
      expect(pages.get('loadedAt')).toBeGreaterThan(0);
    });

    it('accepts the keys on their own without claiming the entries are loaded', () => {
      // The point of the cheap refresh: it answers "which entries are in the
      // workflow" without loading any of them. `ids` means the entries THEMSELVES
      // are loaded — the Workflow board and the collection view both act on it —
      // so setting it here would suppress the load they still need.
      const state = fromJS({ pages: {} });
      const action = {
        type: 'UNPUBLISHED_KEYS_SUCCESS',
        payload: { keys: ['posts/one'] },
      };

      const pages = editorialWorkflow(state, action).get('pages');

      expect(pages.get('keys').toJS()).toEqual(['posts/one']);
      expect(pages.get('loadedAt')).toBeGreaterThan(0);
      expect(pages.get('ids')).toBeUndefined();
    });

    it('adds the key of an entry this session put into review', () => {
      const state = fromJS({ pages: { keys: ['posts/one'], ids: [] } });
      const action = {
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: { collection: 'posts', entry: fromJS({ slug: 'two' }) },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'keys']).toJS()).toEqual([
        'posts/one',
        'posts/two',
      ]);
    });

    it('does not add the same key twice when an entry is saved again', () => {
      const state = fromJS({ pages: { keys: ['posts/one'], ids: [] } });
      const action = {
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: { collection: 'posts', entry: fromJS({ slug: 'one' }) },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'keys']).toJS()).toEqual([
        'posts/one',
      ]);
    });

    it('does not treat a save as proof that the whole key set is current', () => {
      // A save proves one key, not the set: a colleague's draft created since
      // the last refresh is still unaccounted for. Refreshing `loadedAt` here
      // would restart the staleness window without asking the backend anything,
      // which is exactly the multi-editor failure the window exists to bound.
      const confirmedAt = Date.now() - 10 * 60 * 1000;
      const state = fromJS({ pages: { keys: ['posts/one'], ids: [], loadedAt: confirmedAt } });
      const action = {
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: { collection: 'posts', entry: fromJS({ slug: 'two' }) },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'loadedAt'])).toBe(confirmedAt);
    });

    it.each([
      ['publishing', 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS'],
      ['deleting', 'UNPUBLISHED_ENTRY_DELETE_SUCCESS'],
    ])('drops the key when %s closes the workflow branch', (_label, type) => {
      const state = fromJS({
        pages: { keys: ['posts/one', 'posts/two'] },
        entities: { 'posts.one': { collection: 'posts', slug: 'one' } },
      });
      const action = { type, payload: { collection: 'posts', slug: 'one' } };

      const next = editorialWorkflow(state, action);

      expect(next.getIn(['pages', 'keys']).toJS()).toEqual(['posts/two']);
      expect(next.getIn(['entities', 'posts.one'])).toBeUndefined();
    });
  });
});
