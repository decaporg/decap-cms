import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import ConnectedEntriesCollection from '../EntriesCollection';

jest.mock('../Entries', () => 'mock-entries');

const mockStore = configureStore([]);

function toEntriesState(collection, entriesArray, additionalEntriesState = {}) {
  const baseEntries = entriesArray.reduce(
    (acc, entry) => {
      acc.entities[`${collection.get('name')}.${entry.slug}`] = entry;
      acc.pages[collection.get('name')].ids.push(entry.slug);
      return acc;
    },
    { pages: { [collection.get('name')]: { ids: [] } }, entities: {} },
  );

  // Merge additional state (like groups, pagination, etc.)
  const mergedEntries = {
    ...baseEntries,
    ...additionalEntriesState,
    pages: {
      ...baseEntries.pages,
      ...(additionalEntriesState.pages || {}),
    },
    entities: {
      ...baseEntries.entities,
      ...(additionalEntriesState.entities || {}),
    },
  };

  return fromJS(mergedEntries);
}

function createMockStore(collection, entriesArray, additionalEntriesState = {}) {
  return mockStore({
    entries: toEntriesState(collection, entriesArray, additionalEntriesState),
    cursors: fromJS({}),
    config: fromJS({ publish_mode: 'simple' }),
    collections: fromJS({ [collection.get('name')]: collection }),
    editorialWorkflow: fromJS({ pages: { ids: [] } }),
  });
}

describe('Pagination Edge Cases', () => {
  it('disables pagination when grouping is active', () => {
    const collection = fromJS({ name: 'posts', label: 'Posts', folder: 'src/posts' });
    const entriesArray = [
      { slug: 'a', path: 'src/posts/a.md', data: { title: 'A' } },
      { slug: 'b', path: 'src/posts/b.md', data: { title: 'B' } },
    ];
    const store = createMockStore(collection, entriesArray, {
      pages: { posts: { ids: ['a', 'b'], page: 1, pageSize: 1, totalCount: 2 } },
      groups: {
        posts: [
          {
            id: 'group1',
            label: 'Group 1',
            paths: fromJS(['src/posts/a.md']).toSet(),
            active: true,
          },
        ],
      },
    });
    const { queryByLabelText } = render(
      <Provider store={store}>
        <ConnectedEntriesCollection collection={collection} />
      </Provider>,
    );
    // Pagination controls should not be rendered
    expect(queryByLabelText('Entries pagination')).toBeNull();
  });

  // TODO: Add tests for:
  // - Pagination + i18n (grouped locale entries)
  // - Pagination + sorting
  // - Pagination + filtering
  // - Client-side vs. server-side pagination switching
});
