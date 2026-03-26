import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import ConnectedEntriesCollection, {
  EntriesCollection,
  filterNestedEntries,
} from '../EntriesCollection';

jest.mock('../Entries', () => 'mock-entries');

const middlewares = [];
const mockStore = configureStore(middlewares);

function createMockStore(collection, entriesArray, additionalState = {}) {
  return mockStore({
    entries: toEntriesState(collection, entriesArray),
    cursors: fromJS({}),
    config: fromJS({ publish_mode: 'simple' }),
    collections: fromJS({ [collection.get('name')]: collection }),
    editorialWorkflow: fromJS({
      pages: { ids: [] },
    }),
    ...additionalState,
  });
}

function renderWithRedux(component, { store } = {}) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return render(component, { wrapper: Wrapper });
}

function toEntriesState(collection, entriesArray) {
  const entries = entriesArray.reduce(
    (acc, entry) => {
      acc.entities[`${collection.get('name')}.${entry.slug}`] = entry;
      acc.pages[collection.get('name')].ids.push(entry.slug);
      return acc;
    },
    { pages: { [collection.get('name')]: { ids: [] } }, entities: {} },
  );
  return fromJS(entries);
}

describe('filterNestedEntries', () => {
  const entriesArray = [
    { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
    { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
    { slug: 'dir1/dir2/index', path: 'src/pages/dir1/dir2/index.md', data: { title: 'File 2' } },
    { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
    { slug: 'dir3/dir4/index', path: 'src/pages/dir3/dir4/index.md', data: { title: 'File 4' } },
  ];

  describe('with subfolders disabled (subfolders=false)', () => {
    it('should return only immediate children for non root path', () => {
      const entries = fromJS(entriesArray);
      expect(filterNestedEntries('dir3', 'src/pages', entries).toJS()).toEqual([
        { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      ]);
    });

    it('should return only immediate children for root path', () => {
      const entries = fromJS(entriesArray);
      expect(filterNestedEntries('', 'src/pages', entries).toJS()).toEqual([
        { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      ]);
    });

    it('should exclude entries from non-matching paths', () => {
      const entries = fromJS(entriesArray);
      expect(filterNestedEntries('dir1/dir2', 'src/pages', entries).toJS()).toEqual([
        {
          slug: 'dir1/dir2/index',
          path: 'src/pages/dir1/dir2/index.md',
          data: { title: 'File 2' },
        },
      ]);
    });
  });

  describe('with subfolders enabled (subfolders=true)', () => {
    it('should return root file and immediate subfolder entries at root', () => {
      const entries = fromJS(entriesArray);
      // depth <= 2: index.md (depth 1) and dir1/index.md, dir3/index.md (depth 2)
      expect(filterNestedEntries('', 'src/pages', entries, true).toJS()).toEqual([
        { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
        { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
        { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      ]);
    });

    it('should exclude deeply nested entries at root', () => {
      const entries = fromJS(entriesArray);
      const result = filterNestedEntries('', 'src/pages', entries, true);
      const slugs = result.map(e => e.get('slug')).toJS();
      // depth 3 entries should be excluded
      expect(slugs).not.toContain('dir1/dir2/index');
      expect(slugs).not.toContain('dir3/dir4/index');
    });

    it('should return only immediate subfolder entries for non-root path', () => {
      const entries = fromJS(entriesArray);
      // At dir1: depth === 2 means dir2/index.md passes, but index.md (depth 1) does not
      expect(filterNestedEntries('dir1', 'src/pages', entries, true).toJS()).toEqual([
        {
          slug: 'dir1/dir2/index',
          path: 'src/pages/dir1/dir2/index.md',
          data: { title: 'File 2' },
        },
      ]);
    });

    it('should return subfolder entries for non-root path with multiple children', () => {
      const entries = fromJS(entriesArray);
      // At dir3: dir4/index.md (depth 2) passes
      expect(filterNestedEntries('dir3', 'src/pages', entries, true).toJS()).toEqual([
        {
          slug: 'dir3/dir4/index',
          path: 'src/pages/dir3/dir4/index.md',
          data: { title: 'File 4' },
        },
      ]);
    });

    it('should return empty list for leaf path with no deeper children', () => {
      const entries = fromJS(entriesArray);
      // dir3/dir4 has only dir3/dir4/index.md (depth 1 after trimming), no depth-2 children
      expect(filterNestedEntries('dir3/dir4', 'src/pages', entries, true).toJS()).toEqual([]);
    });
  });
});

describe('EntriesCollection', () => {
  const collection = fromJS({ name: 'pages', label: 'Pages', folder: 'src/pages' });
  const props = {
    t: jest.fn(),
    loadEntries: jest.fn(),
    traverseCollectionCursor: jest.fn(),
    loadUnpublishedEntries: jest.fn(),
    isFetching: false,
    cursor: {},
    collection,
    collections: fromJS({ pages: collection }),
    entriesLoaded: true,
    unpublishedEntriesLoaded: true,
    isEditorialWorkflowEnabled: false,
    getWorkflowStatus: jest.fn(),
    getUnpublishedEntries: jest.fn(() => []),
  };

  it('should render with entries', () => {
    const entries = fromJS([{ slug: 'index' }]);
    const { asFragment } = render(<EntriesCollection {...props} entries={entries} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render connected component', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
      { slug: 'dir2/index', path: 'src/pages/dir2/index.md', data: { title: 'File 2' } },
    ];

    const store = createMockStore(collection, entriesArray);

    const { asFragment } = renderWithRedux(<ConnectedEntriesCollection collection={collection} />, {
      store,
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render show only immediate children for nested collection', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
      { slug: 'dir1/dir2/index', path: 'src/pages/dir1/dir2/index.md', data: { title: 'File 2' } },
      { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      { slug: 'dir3/dir4/index', path: 'src/pages/dir3/dir4/index.md', data: { title: 'File 4' } },
    ];

    const store = createMockStore(collection, entriesArray);

    const { asFragment } = renderWithRedux(
      <ConnectedEntriesCollection
        collection={collection.set('nested', fromJS({ depth: 10, subfolders: false }))}
      />,
      { store },
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render with applied filter term for nested collections', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
      { slug: 'dir1/dir2/index', path: 'src/pages/dir1/dir2/index.md', data: { title: 'File 2' } },
      { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      { slug: 'dir3/dir4/index', path: 'src/pages/dir3/dir4/index.md', data: { title: 'File 4' } },
    ];

    const store = createMockStore(collection, entriesArray);

    const { asFragment } = renderWithRedux(
      <ConnectedEntriesCollection
        collection={collection.set('nested', fromJS({ depth: 10, subfolders: false }))}
        filterTerm="dir3/dir4"
      />,
      { store },
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
