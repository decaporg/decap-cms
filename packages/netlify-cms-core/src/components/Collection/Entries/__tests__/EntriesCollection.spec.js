import React from 'react';
import ConnectedEntriesCollection, { EntriesCollection } from '../EntriesCollection';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../Entries', () => 'mock-entries');

const middlewares = [];
const mockStore = configureStore(middlewares);

const renderWithRedux = (component, { store } = {}) => {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return render(component, { wrapper: Wrapper });
};

const toEntriesState = (collection, entriesArray) => {
  const entries = entriesArray.reduce(
    (acc, entry) => {
      acc.entities[`${collection.get('name')}.${entry.slug}`] = entry;
      acc.pages[collection.get('name')].ids.push(entry.slug);
      return acc;
    },
    { pages: { [collection.get('name')]: { ids: [] } }, entities: {} },
  );
  return fromJS(entries);
};

describe('EntriesCollection', () => {
  const collection = fromJS({ name: 'pages', label: 'Pages', folder: 'src/pages' });
  const props = {
    t: jest.fn(),
    loadEntries: jest.fn(),
    traverseCollectionCursor: jest.fn(),
    isFetching: false,
    cursor: {},
    collection,
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

    const store = mockStore({
      entries: toEntriesState(collection, entriesArray),
      cursors: fromJS({}),
    });

    const { asFragment } = renderWithRedux(<ConnectedEntriesCollection collection={collection} />, {
      store,
    });

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render show only immediate children for nested collection', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
      {
        slug: 'dir1/dir2/index.md',
        path: 'src/pages/dir1/dir2/index.md',
        data: { title: 'File 2' },
      },
      { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      { slug: 'dir3/dir4/index', path: 'src/pages/dir3/dir4/index.md', data: { title: 'File 4' } },
    ];

    const store = mockStore({
      entries: toEntriesState(collection, entriesArray),
      cursors: fromJS({}),
    });

    const { asFragment } = renderWithRedux(
      <ConnectedEntriesCollection collection={collection.set('nested', fromJS({ depth: 10 }))} />,
      {
        store,
      },
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render apply filter term for nested collections', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'dir1/index', path: 'src/pages/dir1/index.md', data: { title: 'File 1' } },
      {
        slug: 'dir1/dir2/index.md',
        path: 'src/pages/dir1/dir2/index.md',
        data: { title: 'File 2' },
      },
      { slug: 'dir3/index', path: 'src/pages/dir3/index.md', data: { title: 'File 3' } },
      { slug: 'dir3/dir4/index', path: 'src/pages/dir3/dir4/index.md', data: { title: 'File 4' } },
    ];

    const store = mockStore({
      entries: toEntriesState(collection, entriesArray),
      cursors: fromJS({}),
    });

    const { asFragment } = renderWithRedux(
      <ConnectedEntriesCollection
        collection={collection.set('nested', fromJS({ depth: 10 }))}
        filterTerm="dir3/dir4"
      />,
      {
        store,
      },
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
