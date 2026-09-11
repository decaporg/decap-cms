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

    // The e2e editorial-workflow failures: save an entry, then anything that
    // lists the workflow (the collection view, the board) returned a list
    // taken before that commit landed. Replacing the keys dropped the one the
    // persist had just added, and `loadedAt` then certified the absence — so
    // loadUnpublishedEntry treated a live draft as published and loaded it
    // from the site branch, giving "404 File Not Found" and an editor showing
    // "Published" for an entry still in review.
    // The e2e editorial-workflow failures, root cause. A new entry's draft has
    // no slug until persistEntry computes one, so keying on the entry itself
    // recorded `posts/` — and loadUnpublishedEntry, called with the real slug
    // on the very next line, did not find it and took the absence as proof the
    // entry was published: it deleted the entity and loaded from the site
    // branch, giving "404 File Not Found" and a toolbar reading "Published".
    it('keys a newly created entry on the slug the backend committed under', () => {
      const state = fromJS({ pages: { keys: [] } });
      const action = {
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: {
          collection: 'posts',
          // The draft as serialized: no slug of its own yet.
          entry: fromJS({ slug: '' }),
          slug: '1970-01-01-first-title',
        },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'keys']).toJS()).toEqual([
        'posts/1970-01-01-first-title',
      ]);
    });

    it('records no key at all when neither slug is known', () => {
      const state = fromJS({ pages: { keys: [] } });
      const action = {
        type: 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS',
        payload: { collection: 'posts', entry: fromJS({ slug: '' }) },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'keys']).toJS()).toEqual([]);
    });

    it('keeps a key this session added when a listing does not mention it', () => {
      const state = fromJS({ pages: { keys: ['posts/just-saved'], ids: ['just-saved'] } });
      const action = {
        type: 'UNPUBLISHED_ENTRIES_SUCCESS',
        payload: { pages: {}, entries: [] },
      };

      const pages = editorialWorkflow(state, action).get('pages');

      expect(pages.get('keys').toJS()).toEqual(['posts/just-saved']);
    });

    it('does not duplicate a key the listing also reports', () => {
      const state = fromJS({ pages: { keys: ['posts/one'] } });
      const action = {
        type: 'UNPUBLISHED_ENTRIES_SUCCESS',
        payload: { pages: {}, entries: [{ collection: 'posts', slug: 'one' }] },
      };

      expect(editorialWorkflow(state, action).getIn(['pages', 'keys']).toJS()).toEqual([
        'posts/one',
      ]);
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
