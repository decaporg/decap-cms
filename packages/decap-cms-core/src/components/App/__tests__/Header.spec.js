import { fireEvent, render, screen } from '@testing-library/react';
import { fromJS } from 'immutable';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Header from '../Header';
import en from '../../../../../decap-cms-locales/src/en';

const mockStore = configureStore([thunk]);

function renderHeader(deployStatus, user = { login: 'editor' }) {
  const store = mockStore({
    deployStatus: {
      pendingCount: 0,
      latest: null,
      deployments: [],
      isFetching: false,
      error: null,
      supported: false,
      pageEnabled: false,
      loaded: false,
      entryLabels: {},
      ...deployStatus,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <I18n locale="en" messages={en}>
          <Header
            user={user}
            collections={fromJS({})}
            onCreateEntryClick={jest.fn()}
            onLogoutClick={jest.fn()}
            openMediaLibrary={jest.fn()}
            hasWorkflow={false}
            isTestRepo={false}
            showMediaButton
          />
        </I18n>
      </MemoryRouter>
    </Provider>,
  );
}

const liveDeploy = {
  commit_sha: 'abc1234',
  source: 'webhook',
  external_id: 'd1',
  provider_label: 'Netlify',
  state: 'success',
  target_url: null,
  error_message: null,
  started_at: null,
  finished_at: null,
  updated_at: '2026-09-02T10:00:00.000Z',
};

describe('Header deploy indicator', () => {
  // Every backend that is not Turbo. Nothing about this feature may appear.
  it('renders nothing for a backend that cannot report deploys', () => {
    renderHeader({ supported: false });

    expect(screen.queryByText('Deployed')).not.toBeInTheDocument();
  });

  // Auto-hide (§A7): supported is not enough — a site whose host has never
  // reported a deploy should look like a CMS without the feature.
  it('renders nothing until the site has actually reported a deploy', () => {
    renderHeader({ supported: true, pageEnabled: true });

    expect(screen.queryByText('Deploys')).not.toBeInTheDocument();
    expect(screen.queryByText('Deployed')).not.toBeInTheDocument();
  });

  it('renders nothing when the page is configured off', () => {
    renderHeader({ supported: true, pageEnabled: false, latest: liveDeploy });

    expect(screen.queryByText('Deployed')).not.toBeInTheDocument();
  });

  it('appears once a deploy is known, naming the state, and links to the page', () => {
    renderHeader({ supported: true, pageEnabled: true, latest: liveDeploy });

    expect(screen.getByText('Deployed').closest('a')).toHaveAttribute('href', '/deploys');
  });

  it('names the state while a save is outstanding', () => {
    renderHeader({ supported: true, pageEnabled: true, pendingCount: 1 });

    expect(screen.getByText('Publishing…')).toBeInTheDocument();
  });

  it('names a failed build', () => {
    renderHeader({
      supported: true,
      pageEnabled: true,
      latest: { ...liveDeploy, state: 'failed' },
    });

    expect(screen.getByText('Build failed')).toBeInTheDocument();
  });

  // It is the only nav item that is not somewhere an editor goes to work.
  it('comes last in the navigation', () => {
    renderHeader({ supported: true, pageEnabled: true, latest: liveDeploy });

    const items = [...document.querySelectorAll('header nav li')].map(li => li.textContent.trim());
    expect(items[items.length - 1]).toBe('Deployed');
  });
});

describe('Header account dropdown', () => {
  function openAccountDropdown() {
    fireEvent.click(screen.getByLabelText('Account options dropdown'));
  }

  // Backends can sign you back in without asking — Decap Turbo's dashboard
  // session deliberately outlives a CMS logout — so the menu has to say which
  // account you are in as.
  it('names the signed-in user', () => {
    renderHeader(undefined, {
      login: 'editor',
      name: 'Ed Editor',
      email: 'editor@example.com',
    });

    openAccountDropdown();

    expect(screen.getByText('Ed Editor')).toBeInTheDocument();
    expect(screen.getByText('editor@example.com')).toBeInTheDocument();
  });

  it('says nothing when the backend knows no name or email', () => {
    renderHeader(undefined, { login: '' });

    openAccountDropdown();

    expect(screen.getByText('Log Out').closest('ul').textContent).toBe('Log Out');
  });
});
