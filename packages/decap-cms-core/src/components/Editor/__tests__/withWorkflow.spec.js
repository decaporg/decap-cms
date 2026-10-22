import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { OrderedMap, fromJS } from 'immutable';

import withWorkflow from '../withWorkflow';
import { SIMPLE } from '../../../constants/publishModes';

const mockStore = configureStore([thunk]);

// eslint-disable-next-line react/display-name, react/prop-types
function StubEditor({ collection }) {
  return <div data-testid="editor-mounted">{collection.get('name')}</div>;
}

function renderWithWorkflow({ collections, matchName }) {
  const store = mockStore({
    collections,
    config: { publish_mode: SIMPLE },
  });

  const Wrapped = withWorkflow(StubEditor);

  // `collection` is passed here as an explicit ownProp because in real usage
  // it comes from Editor.js's OWN outer connect() (see
  // `connect(mapStateToProps, ...)(withWorkflow(translate()(Editor)))`),
  // which resolves it (or null, per its matching guard) from the exact same
  // `state.collections.get(ownProps.match.params.name)` before withWorkflow
  // ever runs — this simulates that already-resolved prop rather than
  // re-deriving it, matching real usage.
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Wrapped
          newEntry={false}
          location={{ search: '' }}
          match={{ params: { name: matchName, 0: 'some-slug' } }}
          collection={collections.get(matchName) || null}
        />
      </MemoryRouter>
    </Provider>,
  );
}

describe('withWorkflow', () => {
  const collections = OrderedMap({
    posts: fromJS({ name: 'posts', type: 'folder_based_collection' }),
  });

  it('mounts the wrapped Editor when the routed collection exists in state', () => {
    renderWithWorkflow({ collections, matchName: 'posts' });
    expect(screen.getByTestId('editor-mounted')).toHaveTextContent('posts');
  });

  it('redirects instead of mounting Editor when the routed collection is missing (e.g. permission-filtered) from state', () => {
    renderWithWorkflow({ collections, matchName: 'authors' });
    expect(screen.queryByTestId('editor-mounted')).not.toBeInTheDocument();
  });
});
