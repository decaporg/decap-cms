import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ConnectedNestedCollection, {
  NestedCollection,
  getTreeData,
  walk,
  updateNode,
} from '../NestedCollection';
import { render, fireEvent } from '@testing-library/react';
import { fromJS } from 'immutable';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('netlify-cms-ui-default', () => {
  const actual = jest.requireActual('netlify-cms-ui-default');
  return {
    ...actual,
    Icon: 'mocked-icon',
  };
});

const middlewares = [];
const mockStore = configureStore(middlewares);

function renderWithRedux(component, { store } = {}) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return render(component, { wrapper: Wrapper });
}

describe('NestedCollection', () => {
  const collection = fromJS({
    name: 'pages',
    label: 'Pages',
    folder: 'src/pages',
    fields: [{ name: 'title', widget: 'string' }],
  });

  it('should render correctly with no entries', () => {
    const entries = fromJS([]);
    const { asFragment, getByTestId } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    expect(getByTestId('/')).toHaveTextContent('Pages');
    expect(getByTestId('/')).toHaveAttribute('href', '/collections/pages');
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly with nested entries', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/b/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 3' } },
      { path: 'src/pages/b/a/index.md', data: { title: 'File 4' } },
    ]);
    const { asFragment, getByTestId } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    // expand the tree
    fireEvent.click(getByTestId('/'));

    expect(getByTestId('/a')).toHaveTextContent('File 1');
    expect(getByTestId('/a')).toHaveAttribute('href', '/collections/pages/filter/a');

    expect(getByTestId('/b')).toHaveTextContent('File 2');
    expect(getByTestId('/b')).toHaveAttribute('href', '/collections/pages/filter/b');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should keep expanded nodes on re-render', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/b/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 3' } },
      { path: 'src/pages/b/a/index.md', data: { title: 'File 4' } },
    ]);
    const { getByTestId, rerender } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    fireEvent.click(getByTestId('/'));
    fireEvent.click(getByTestId('/a'));

    expect(getByTestId('/a')).toHaveTextContent('File 1');

    const newEntries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/b/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 3' } },
      { path: 'src/pages/b/a/index.md', data: { title: 'File 4' } },
      { path: 'src/pages/c/index.md', data: { title: 'File 5' } },
      { path: 'src/pages/c/a/index.md', data: { title: 'File 6' } },
    ]);

    rerender(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={newEntries} />
      </MemoryRouter>,
    );

    expect(getByTestId('/a')).toHaveTextContent('File 1');
  });

  it('should expand nodes based on filterTerm', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/a/index.md', data: { title: 'File 3' } },
    ]);

    const { getByTestId, queryByTestId, rerender } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    expect(queryByTestId('/a/a')).toBeNull();

    rerender(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} filterTerm={'a/a'} />
      </MemoryRouter>,
    );

    expect(getByTestId('/a/a')).toHaveTextContent('File 2');
  });

  it('should ignore filterTerm once a user toggles an node', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/a/index.md', data: { title: 'File 3' } },
    ]);

    const { getByTestId, queryByTestId, rerender } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} filterTerm={'a/a'} />
      </MemoryRouter>,
    );

    expect(getByTestId('/a/a')).toHaveTextContent('File 2');

    fireEvent.click(getByTestId('/a'));

    rerender(
      <MemoryRouter>
        <NestedCollection
          collection={collection}
          entries={fromJS(entries.toJS())}
          filterTerm={'a/a'}
        />
      </MemoryRouter>,
    );

    expect(queryByTestId('/a/a')).toBeNull();
  });

  it('should not collapse an unselected node when clicked', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/a/index.md', data: { title: 'File 3' } },
      { path: 'src/pages/a/a/a/a/index.md', data: { title: 'File 4' } },
    ]);

    const { getByTestId } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    fireEvent.click(getByTestId('/'));
    fireEvent.click(getByTestId('/a'));
    fireEvent.click(getByTestId('/a/a'));

    expect(getByTestId('/a/a')).toHaveTextContent('File 2');
    fireEvent.click(getByTestId('/a'));
    expect(getByTestId('/a/a')).toHaveTextContent('File 2');
  });

  it('should collapse a selected node when clicked', () => {
    const entries = fromJS([
      { path: 'src/pages/index.md', data: { title: 'Root' } },
      { path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { path: 'src/pages/a/a/index.md', data: { title: 'File 2' } },
      { path: 'src/pages/a/a/a/index.md', data: { title: 'File 3' } },
      { path: 'src/pages/a/a/a/a/index.md', data: { title: 'File 4' } },
    ]);

    const { getByTestId, queryByTestId } = render(
      <MemoryRouter>
        <NestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
    );

    fireEvent.click(getByTestId('/'));
    fireEvent.click(getByTestId('/a'));
    fireEvent.click(getByTestId('/a/a'));

    expect(getByTestId('/a/a/a')).toHaveTextContent('File 3');
    fireEvent.click(getByTestId('/a/a'));
    expect(queryByTestId('/a/a/a')).toBeNull();
  });

  it('should render connected component', () => {
    const entriesArray = [
      { slug: 'index', path: 'src/pages/index.md', data: { title: 'Root' } },
      { slug: 'a/index', path: 'src/pages/a/index.md', data: { title: 'File 1' } },
      { slug: 'b/index', path: 'src/pages/b/index.md', data: { title: 'File 2' } },
      { slug: 'a/a/index', path: 'src/pages/a/a/index.md', data: { title: 'File 3' } },
      { slug: 'b/a/index', path: 'src/pages/b/a/index.md', data: { title: 'File 4' } },
    ];
    const entries = entriesArray.reduce(
      (acc, entry) => {
        acc.entities[`${collection.get('name')}.${entry.slug}`] = entry;
        acc.pages[collection.get('name')].ids.push(entry.slug);
        return acc;
      },
      { pages: { [collection.get('name')]: { ids: [] } }, entities: {} },
    );

    const store = mockStore({ entries: fromJS(entries) });

    const { asFragment, getByTestId } = renderWithRedux(
      <MemoryRouter>
        <ConnectedNestedCollection collection={collection} entries={entries} />
      </MemoryRouter>,
      { store },
    );

    // expand the root
    fireEvent.click(getByTestId('/'));

    expect(getByTestId('/a')).toHaveTextContent('File 1');
    expect(getByTestId('/a')).toHaveAttribute('href', '/collections/pages/filter/a');

    expect(getByTestId('/b')).toHaveTextContent('File 2');
    expect(getByTestId('/b')).toHaveAttribute('href', '/collections/pages/filter/b');

    expect(asFragment()).toMatchSnapshot();
  });

  describe('getTreeData', () => {
    it('should return nested tree data from entries', () => {
      const entries = fromJS([
        { path: 'src/pages/index.md', data: { title: 'Root' } },
        { path: 'src/pages/intro/index.md', data: { title: 'intro index' } },
        { path: 'src/pages/intro/category/index.md', data: { title: 'intro category index' } },
        { path: 'src/pages/compliance/index.md', data: { title: 'compliance index' } },
      ]);

      const treeData = getTreeData(collection, entries);

      expect(treeData).toEqual([
        {
          title: 'Pages',
          path: '/',
          isDir: true,
          isRoot: true,
          children: [
            {
              title: 'intro',
              path: '/intro',
              isDir: true,
              isRoot: false,
              children: [
                {
                  title: 'category',
                  path: '/intro/category',
                  isDir: true,
                  isRoot: false,
                  children: [
                    {
                      path: '/intro/category/index.md',
                      data: { title: 'intro category index' },
                      title: 'intro category index',
                      isDir: false,
                      isRoot: false,
                      children: [],
                    },
                  ],
                },
                {
                  path: '/intro/index.md',
                  data: { title: 'intro index' },
                  title: 'intro index',
                  isDir: false,
                  isRoot: false,
                  children: [],
                },
              ],
            },
            {
              title: 'compliance',
              path: '/compliance',
              isDir: true,
              isRoot: false,
              children: [
                {
                  path: '/compliance/index.md',
                  data: { title: 'compliance index' },
                  title: 'compliance index',
                  isDir: false,
                  isRoot: false,
                  children: [],
                },
              ],
            },
            {
              path: '/index.md',
              data: { title: 'Root' },
              title: 'Root',
              isDir: false,
              isRoot: false,
              children: [],
            },
          ],
        },
      ]);
    });

    it('should ignore collection summary', () => {
      const entries = fromJS([{ path: 'src/pages/index.md', data: { title: 'Root' } }]);

      const treeData = getTreeData(collection, entries);

      expect(treeData).toEqual([
        {
          title: 'Pages',
          path: '/',
          isDir: true,
          isRoot: true,
          children: [
            {
              path: '/index.md',
              data: { title: 'Root' },
              title: 'Root',
              isDir: false,
              isRoot: false,
              children: [],
            },
          ],
        },
      ]);
    });

    it('should use nested collection summary for title', () => {
      const entries = fromJS([{ path: 'src/pages/index.md', data: { title: 'Root' } }]);

      const treeData = getTreeData(
        collection.setIn(['nested', 'summary'], '{{filename}}'),
        entries,
      );

      expect(treeData).toEqual([
        {
          title: 'Pages',
          path: '/',
          isDir: true,
          isRoot: true,
          children: [
            {
              path: '/index.md',
              data: { title: 'Root' },
              title: 'index',
              isDir: false,
              isRoot: false,
              children: [],
            },
          ],
        },
      ]);
    });
  });

  describe('walk', () => {
    it('should visit every tree node', () => {
      const entries = fromJS([
        { path: 'src/pages/index.md', data: { title: 'Root' } },
        { path: 'src/pages/dir1/index.md', data: { title: 'Dir1 File' } },
        { path: 'src/pages/dir2/index.md', data: { title: 'Dir2 File' } },
      ]);

      const treeData = getTreeData(collection, entries);
      const callback = jest.fn();
      walk(treeData, callback);

      expect(callback).toHaveBeenCalledTimes(6);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/index.md' }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/dir1' }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/dir2' }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/dir1/index.md' }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ path: '/dir2/index.md' }));
    });
  });

  describe('updateNode', () => {
    it('should update node', () => {
      const entries = fromJS([
        { path: 'src/pages/index.md', data: { title: 'Root' } },
        { path: 'src/pages/dir1/index.md', data: { title: 'Dir1 File' } },
        { path: 'src/pages/dir2/index.md', data: { title: 'Dir2 File' } },
      ]);

      const treeData = getTreeData(collection, entries);
      expect(treeData[0].children[0].children[0].expanded).toBeUndefined();

      const callback = jest.fn(node => ({ ...node, expanded: true }));
      const node = { path: '/dir1/index.md' };
      updateNode(treeData, node, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(node);
      expect(treeData[0].children[0].children[0].expanded).toEqual(true);
    });
  });
});
