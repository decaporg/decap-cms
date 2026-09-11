import { fromJS } from 'immutable';
import { render, fireEvent, waitFor } from '@testing-library/react';

import { DecapCmsWidgetRelation } from '../';
import RelationControl from '../RelationControl';
import relationCache from '../RelationCache';

// Deliberately NOT mocking RelationCache: what a failure does to the cache is
// the whole point of these tests.
jest.mock('react-window', () => {
  function FixedSizeList(props) {
    return props.itemData.options;
  }
  return { FixedSizeList };
});

const RelationControlComponent = DecapCmsWidgetRelation.controlComponent;

const field = fromJS({
  name: 'post',
  collection: 'posts',
  display_fields: ['title'],
  search_fields: ['title'],
  value_field: 'title',
});

function hit(title) {
  return { collection: 'posts', slug: title, path: `posts/${title}.md`, data: { title } };
}

/** What the `query` thunk resolves with when the request failed. */
function failedQuery() {
  return Promise.resolve({ payload: { error: new Error('statement timeout') } });
}

function succeededQuery() {
  return Promise.resolve({ payload: { hits: [hit('Post # 1'), hit('Post # 2')] } });
}

function setup(query) {
  const helpers = render(
    <RelationControlComponent
      field={field}
      value={undefined}
      query={query}
      queryHits={[]}
      onChange={jest.fn()}
      forID="relation-field"
      classNameWrapper=""
      setActiveStyle={jest.fn()}
      setInactiveStyle={jest.fn()}
    />,
  );
  return { ...helpers, input: helpers.container.querySelector('input') };
}

describe('relation options after a failed query', () => {
  beforeEach(() => {
    relationCache.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The bug: the query thunk resolves even when the request failed, so the
  // failure was stored as "this collection is empty" and read back forever.
  it('does not cache a failed query', async () => {
    const queryFn = jest.fn(failedQuery);

    await expect(
      relationCache.getOptions('posts', ['title'], '', undefined, () =>
        queryFn().then(r => {
          if (r.payload.error) throw r.payload.error;
          return r.payload.hits;
        }),
      ),
    ).rejects.toThrow('statement timeout');

    // Nothing was stored, so the next caller genuinely asks again.
    const hits = await relationCache.getOptions('posts', ['title'], '', undefined, () =>
      succeededQuery().then(r => r.payload.hits),
    );

    expect(hits).toHaveLength(2);
  });

  it('still caches a successful query', async () => {
    const queryFn = jest.fn(() => succeededQuery().then(r => r.payload.hits));

    await relationCache.getOptions('posts', ['title'], '', undefined, queryFn);
    await relationCache.getOptions('posts', ['title'], '', undefined, queryFn);

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  // react-select's own `defaultOptions={true}` loads once in a mount effect and
  // can never be asked again, so before this the menu stayed empty for the life
  // of the page even once the backend had recovered.
  it('retries the menu list when the dropdown is opened', async () => {
    const query = jest
      .fn()
      .mockImplementationOnce(failedQuery)
      .mockImplementation(succeededQuery);

    const { input, getByText, queryByText } = setup(query);

    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    expect(queryByText('Post # 1')).not.toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(getByText('Post # 1')).toBeInTheDocument();
    });
  });

  // Without this the menu says "No options" for the whole of a slow load, which
  // is indistinguishable from the bug being fixed.
  it('says it is loading while the list is in flight', async () => {
    let release;
    const query = jest.fn(
      () =>
        new Promise(resolve => {
          release = () => resolve({ payload: { hits: [hit('Post # 1')] } });
        }),
    );

    const { input, getByText, queryByText } = setup(query);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(getByText('Loading options…')).toBeInTheDocument();

    release();
    await waitFor(() => {
      expect(queryByText('Loading options…')).not.toBeInTheDocument();
    });
  });

  // The core Widget borrows this method off the control instance and calls it
  // with `nextProps` alone, to decide whether the WIDGET should re-render
  // (components/Editor/EditorControlPane/Widget.js:92). Dereferencing the
  // missing `nextState` threw and took the whole editor down with an error
  // screen the moment a dropdown was opened.
  function instanceWithProps() {
    // The props object is reused as `nextProps` for the unchanged case: these
    // are identity comparisons, so a fresh `{queryHits: []}` would read as a
    // change and prove nothing.
    const props = { field, value: undefined, hasActiveStyle: false, queryHits: [], query: jest.fn() };
    const instance = new RelationControl(props);
    instance.state = { initialOptions: [], menuOptions: undefined, loadingOptions: true };
    return { instance, props };
  }

  it('survives shouldComponentUpdate being called without nextState', () => {
    const { instance, props } = instanceWithProps();

    expect(() => instance.shouldComponentUpdate(props)).not.toThrow();
    expect(instance.shouldComponentUpdate(props)).toBe(false);
    // A real prop change must still be reported, with or without nextState.
    expect(instance.shouldComponentUpdate({ ...props, value: 'Post # 1' })).toBe(true);
  });

  it('still repaints when only state changed and React passes nextState', () => {
    const { instance, props } = instanceWithProps();
    const state = instance.state;

    expect(instance.shouldComponentUpdate(props, state)).toBe(false);
    expect(instance.shouldComponentUpdate(props, { ...state, menuOptions: [] })).toBe(true);
    expect(instance.shouldComponentUpdate(props, { ...state, loadingOptions: false })).toBe(true);
  });

  // A collection that really is empty must not be re-queried on every open.
  it('does not retry when the list loaded and was genuinely empty', async () => {
    const query = jest.fn(() => Promise.resolve({ payload: { hits: [] } }));
    const { input } = setup(query);

    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(query).toHaveBeenCalledTimes(1);
  });
});
