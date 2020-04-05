import React from 'react';
import { Editor } from '../Editor';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

jest.mock('lodash/debounce', () => {
  const flush = jest.fn();
  return func => {
    func.flush = flush;
    return func;
  };
});
jest.mock('../EditorInterface', () => props => <mock-editor-interface {...props} />);
jest.mock('netlify-cms-ui-default', () => {
  return {
    // eslint-disable-next-line react/display-name
    Loader: props => <mock-loader {...props} />,
  };
});
jest.mock('Routing/history');

describe('Editor', () => {
  const props = {
    boundGetAsset: jest.fn(),
    changeDraftField: jest.fn(),
    changeDraftFieldValidation: jest.fn(),
    collection: fromJS({ name: 'posts' }),
    createDraftDuplicateFromEntry: jest.fn(),
    createEmptyDraft: jest.fn(),
    discardDraft: jest.fn(),
    entry: fromJS({}),
    entryDraft: fromJS({}),
    loadEntry: jest.fn(),
    persistEntry: jest.fn(),
    deleteEntry: jest.fn(),
    showDelete: true,
    fields: fromJS([]),
    slug: 'slug',
    newEntry: true,
    updateUnpublishedEntryStatus: jest.fn(),
    publishUnpublishedEntry: jest.fn(),
    deleteUnpublishedEntry: jest.fn(),
    logoutUser: jest.fn(),
    loadEntries: jest.fn(),
    deployPreview: fromJS({}),
    loadDeployPreview: jest.fn(),
    user: fromJS({}),
    t: jest.fn(key => key),
    location: { search: '?title=title' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loader when entryDraft is null', () => {
    // suppress prop type error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { asFragment } = render(<Editor {...props} entryDraft={null} />);
    expect(asFragment()).toMatchSnapshot();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Warning: Failed prop type: Required prop `entryDraft` was not specified in `Editor`.\n    in Editor',
    );
  });

  it('should render loader when entryDraft entry is undefined', () => {
    const { asFragment } = render(<Editor {...props} entryDraft={fromJS({})} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render loader when entry is fetching', () => {
    const { asFragment } = render(
      <Editor {...props} entryDraft={fromJS({ entry: {} })} entry={fromJS({ isFetching: true })} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render editor interface when entry is not fetching', () => {
    const { asFragment } = render(
      <Editor
        {...props}
        entryDraft={fromJS({ entry: { slug: 'slug' } })}
        entry={fromJS({ isFetching: false })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should create new draft on new entry when mounting', () => {
    render(
      <Editor
        {...props}
        entryDraft={fromJS({ entry: { slug: 'slug' } })}
        entry={fromJS({ isFetching: false })}
        newEntry={true}
      />,
    );

    expect(props.createEmptyDraft).toHaveBeenCalledTimes(1);
    expect(props.createEmptyDraft).toHaveBeenCalledWith(props.collection, '?title=title');
    expect(props.loadEntry).toHaveBeenCalledTimes(0);
  });

  it('should load entry on existing entry when mounting', () => {
    render(
      <Editor
        {...props}
        entryDraft={fromJS({ entry: { slug: 'slug' } })}
        entry={fromJS({ isFetching: false })}
        newEntry={false}
      />,
    );

    expect(props.createEmptyDraft).toHaveBeenCalledTimes(0);
    expect(props.loadEntry).toHaveBeenCalledTimes(1);
    expect(props.loadEntry).toHaveBeenCalledWith(props.collection, 'slug');
  });

  it('should load entires when entries are not loaded when mounting', () => {
    render(
      <Editor
        {...props}
        entryDraft={fromJS({ entry: { slug: 'slug' } })}
        entry={fromJS({ isFetching: false })}
        collectionEntriesLoaded={false}
      />,
    );

    expect(props.loadEntries).toHaveBeenCalledTimes(1);
    expect(props.loadEntries).toHaveBeenCalledWith(props.collection);
  });

  it('should not load entires when entries are loaded when mounting', () => {
    render(
      <Editor
        {...props}
        entryDraft={fromJS({ entry: { slug: 'slug' } })}
        entry={fromJS({ isFetching: false })}
        collectionEntriesLoaded={true}
      />,
    );

    expect(props.loadEntries).toHaveBeenCalledTimes(0);
  });
});
