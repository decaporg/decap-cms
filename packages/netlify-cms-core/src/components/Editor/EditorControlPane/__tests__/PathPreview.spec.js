import React from 'react';
import { Map } from 'immutable';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import ConnectedPathPreview, { PathPreview } from '../PathPreview';

jest.mock('Reducers', () => {
  return () => ({});
});
jest.mock('Selectors/entryDraft');
jest.mock('react-polyglot', () => {
  return {
    translate: () => Component => props => <Component {...props} t={jest.fn(key => key)} />,
  };
});

describe('PathPreview', () => {
  it('should render successfully and match snapshot', () => {
    const props = {
      value: 'posts/2019/index.md',
      t: jest.fn(key => key),
    };
    const { asFragment } = render(<PathPreview {...props} />);

    expect(asFragment()).toMatchSnapshot();
  });
});

function renderWithRedux(ui, { initialState, store = createStore(() => ({}), initialState) } = {}) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('ConnectedPathPreview', () => {
  const { selectDraftPath } = require('Selectors/entryDraft');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use existing path when newRecord is false', () => {
    const props = {
      collection: Map({
        name: 'posts',
      }),
      entry: Map({
        newRecord: false,
        data: {},
        path: 'existing-path/index.md',
      }),
    };
    const { asFragment, getByTestId } = renderWithRedux(<ConnectedPathPreview {...props} />);

    expect(selectDraftPath).toHaveBeenCalledTimes(0);

    expect(getByTestId('site_path-preview')).toHaveTextContent('existing-path/index.md');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should evaluate preview path when newRecord is true', () => {
    selectDraftPath.mockReturnValue('preview-path/index.md');
    const props = {
      collection: Map({
        name: 'posts',
      }),
      entry: Map({
        newRecord: true,
        data: {},
      }),
    };
    const { asFragment, getByTestId } = renderWithRedux(<ConnectedPathPreview {...props} />);

    expect(selectDraftPath).toHaveBeenCalledTimes(1);
    expect(selectDraftPath).toHaveBeenCalledWith({}, props.collection, props.entry);

    expect(getByTestId('site_path-preview')).toHaveTextContent('preview-path/index.md');

    expect(asFragment()).toMatchSnapshot();
  });
});
