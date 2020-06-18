import React from 'react';
import ConnectedCollection, { Collection } from '../Collection';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../Entries/EntriesCollection', () => 'mock-entries-collection');
jest.mock('../CollectionTop', () => 'mock-collection-top');
jest.mock('../CollectionControls', () => 'mock-collection-controls');
jest.mock('../Sidebar', () => 'mock-sidebar');

const middlewares = [];
const mockStore = configureStore(middlewares);

const renderWithRedux = (component, { store } = {}) => {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return render(component, { wrapper: Wrapper });
};

describe('Collection', () => {
  const collection = fromJS({ name: 'pages', sortableFields: [], view_filters: [] });
  const props = {
    collections: fromJS([collection]).toOrderedMap(),
    collection,
    collectionName: collection.get('name'),
    t: jest.fn(key => key),
    onSortClick: jest.fn(),
  };

  it('should render with collection without create url', () => {
    const { asFragment } = render(
      <Collection {...props} collection={collection.set('create', false)} />,
    );

    expect(asFragment()).toMatchSnapshot();
  });
  it('should render with collection with create url', () => {
    const { asFragment } = render(
      <Collection {...props} collection={collection.set('create', true)} />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render with collection with create url and path', () => {
    const { asFragment } = render(
      <Collection {...props} collection={collection.set('create', true)} filterTerm="dir1/dir2" />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render connected component', () => {
    const store = mockStore({
      collections: props.collections,
      entries: fromJS({}),
    });

    const { asFragment } = renderWithRedux(<ConnectedCollection match={{ params: {} }} />, {
      store,
    });

    expect(asFragment()).toMatchSnapshot();
  });
});
