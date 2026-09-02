import { fireEvent, render, screen } from '@testing-library/react';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Deploys, { Deploys as UnconnectedDeploys } from '../Deploys';
import { deployIndicator } from '../../App/deployStatusIndicator';
import en from '../../../../../decap-cms-locales/src/en';

const mockStore = configureStore([thunk]);

function row(overrides = {}) {
  return {
    commit_sha: 'abc1234def5678',
    source: 'webhook',
    external_id: 'deploy-1',
    provider_label: 'Netlify',
    state: 'success',
    target_url: 'https://site.example',
    error_message: null,
    started_at: null,
    finished_at: '2026-09-02T10:00:00.000Z',
    updated_at: '2026-09-02T10:00:00.000Z',
    ...overrides,
  };
}

function renderPage(deployStatus) {
  const store = mockStore({
    deployStatus: {
      deployments: [],
      pendingCount: 0,
      latest: null,
      isFetching: false,
      error: null,
      supported: true,
      pageEnabled: true,
      loaded: true,
      entryLabels: {},
      ...deployStatus,
    },
  });

  render(
    <Provider store={store}>
      <I18n locale="en" messages={en}>
        <Deploys />
      </I18n>
    </Provider>,
  );

  return store;
}

describe('Deploys page', () => {
  it('answers the editor question first, in a sentence', () => {
    renderPage({ latest: row(), deployments: [row()] });

    expect(screen.getByText(/Your latest change is live/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View site' })).toHaveAttribute(
      'href',
      'https://site.example',
    );
  });

  // An editor with a save in flight is asking about that save, not about a
  // build that finished before it.
  it('reports publishing ahead of a finished deploy', () => {
    renderPage({ pendingCount: 2, latest: row(), deployments: [row()] });

    expect(screen.getByText(/Publishing 2 change/)).toBeInTheDocument();
  });

  it('says the last build failed', () => {
    renderPage({ latest: row({ state: 'failed' }), deployments: [row({ state: 'failed' })] });

    expect(screen.getByText(/The last build failed/)).toBeInTheDocument();
  });

  it('lists deploys with their host, commit and state', () => {
    renderPage({
      latest: row(),
      deployments: [row(), row({ external_id: 'deploy-2', state: 'failed', error_message: 'Build script failed' })],
    });

    expect(screen.getAllByText('abc1234')).toHaveLength(2);
    expect(screen.getAllByText('Netlify')).toHaveLength(2);
    expect(screen.getByText('Build script failed')).toBeInTheDocument();
  });

  // Not a failure — the change ships inside a newer deploy.
  it('calls a cancelled deploy superseded, not failed', () => {
    renderPage({ deployments: [row({ state: 'canceled' })], latest: row({ state: 'canceled' }) });

    expect(screen.getByText('Superseded')).toBeInTheDocument();
    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });

  // The single most likely reason someone opens this page.
  it('explains an empty page instead of shrugging at it', () => {
    renderPage({ deployments: [], loaded: true });

    expect(screen.getByText(/Netlify does not report branch or production deploys/)).toBeInTheDocument();
  });

  it('names the sources when a site reports from more than one', () => {
    renderPage({
      deployments: [row(), row({ external_id: 'd2', source: 'github_deployment', provider_label: 'Vercel' })],
    });

    expect(screen.getByText(/Netlify, Vercel/)).toBeInTheDocument();
  });

  it('does not claim a single source is several', () => {
    renderPage({ deployments: [row(), row({ external_id: 'd2' })] });

    expect(screen.queryByText(/reported from more than one place/)).not.toBeInTheDocument();
  });

  it('reads deploys on mount and again on Refresh', () => {
    // Opening the page and pressing Refresh are two of only three things that
    // may cause a read — see §A8 on why nothing else may poll.
    const loadDeployHistory = jest.fn();

    render(
      <I18n locale="en" messages={en}>
        <UnconnectedDeploys
          deployments={[row()]}
          pendingCount={0}
          latest={row()}
          isFetching={false}
          loaded
          loadDeployHistory={loadDeployHistory}
          commitUrls={{}}
          entryLabels={{}}
          t={key => key}
        />
      </I18n>,
    );

    expect(loadDeployHistory).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'ui.deploys.refresh' }));

    expect(loadDeployHistory).toHaveBeenCalledTimes(2);
  });

  // A build finishing while the page is open should change the page, not wait
  // for someone to reload it.
  it('refreshes itself while it is open, silently, and stops on unmount', () => {
    jest.useFakeTimers();
    const loadDeployHistory = jest.fn();

    const { unmount } = render(
      <I18n locale="en" messages={en}>
        <UnconnectedDeploys
          deployments={[row()]}
          pendingCount={0}
          latest={row()}
          isFetching={false}
          loaded
          loadDeployHistory={loadDeployHistory}
          commitUrls={{}}
          entryLabels={{}}
          t={key => key}
        />
      </I18n>,
    );

    jest.advanceTimersByTime(30000);

    expect(loadDeployHistory).toHaveBeenCalledTimes(4);
    // Silent, or the Refresh button would flicker to "Refreshing…" on its own
    // every ten seconds.
    expect(loadDeployHistory).toHaveBeenLastCalledWith({ silent: true });

    unmount();
    jest.advanceTimersByTime(60000);

    // §A8: the repeating read is scoped to a page the editor deliberately
    // opened. Leaving it must leave an idle CMS polling zero times.
    expect(loadDeployHistory).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
  });

  it('does not let Refresh stack reads while one is in flight', () => {
    const loadDeployHistory = jest.fn();

    render(
      <I18n locale="en" messages={en}>
        <UnconnectedDeploys
          deployments={[row()]}
          pendingCount={0}
          latest={row()}
          isFetching
          loaded
          loadDeployHistory={loadDeployHistory}
          commitUrls={{}}
          entryLabels={{}}
          t={key => key}
        />
      </I18n>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'ui.deploys.refreshing' }));

    expect(loadDeployHistory).toHaveBeenCalledTimes(1);
  });

  // Only one deploy is live at a time. Calling every past success "Live" is
  // simply untrue, and the page is the place someone goes to check.
  it('calls only the newest success Live, and the rest Deployed', () => {
    renderPage({
      deployments: [
        row({ external_id: 'newest' }),
        row({ external_id: 'older' }),
        row({ external_id: 'oldest' }),
      ],
    });

    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getAllByText('Deployed')).toHaveLength(2);
  });

  // A failed build does not take the site down — the last successful deploy is
  // still the one being served, so it is still the live one.
  it('keeps the last success Live when a newer deploy failed', () => {
    renderPage({
      deployments: [
        row({ external_id: 'newest', state: 'failed' }),
        row({ external_id: 'older' }),
        row({ external_id: 'oldest' }),
      ],
    });

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getAllByText('Deployed')).toHaveLength(1);
  });

  it('names the git forge rather than saying "Git provider"', () => {
    renderPage({
      deployments: [
        row({ external_id: 'a', source: 'github_deployment', provider_label: null }),
        row({ external_id: 'b', source: 'gitlab_pipeline', provider_label: null }),
      ],
    });

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('GitLab')).toBeInTheDocument();
    expect(screen.queryByText('Git provider')).not.toBeInTheDocument();
  });

  it('links the state to the deploy and the commit to the commit', () => {
    render(
      <I18n locale="en" messages={en}>
        <UnconnectedDeploys
          deployments={[row()]}
          pendingCount={0}
          latest={row()}
          isFetching={false}
          loaded
          loadDeployHistory={jest.fn()}
          commitUrls={{ abc1234def5678: 'https://github.com/acme/site/commit/abc1234def5678' }}
          entryLabels={{}}
          t={key => key}
        />
      </I18n>,
    );

    const commitLink = screen.getByText('abc1234').closest('a');
    expect(commitLink).toHaveAttribute(
      'href',
      'https://github.com/acme/site/commit/abc1234def5678',
    );
    // A commit that links to the deployed site looks like it will show you the
    // change and shows you the home page.
    expect(commitLink).not.toHaveAttribute('href', 'https://site.example');
  });

  it('leaves the commit as plain text when the backend cannot link it', () => {
    renderPage({ deployments: [row()] });

    expect(screen.getByText('abc1234').closest('a')).toBeNull();
  });

  // The same value the notification shows — the entry's title, not the commit
  // message, which carries the slug and is template-configurable.
  it('names the entry a deploy carried', () => {
    renderPage({
      deployments: [row()],
      entryLabels: { abc1234def5678: 'Spring menu' },
    });

    expect(screen.getByText('Spring menu')).toBeInTheDocument();
  });

  it('leaves the entry blank for a commit the CMS did not make', () => {
    renderPage({ deployments: [row()], entryLabels: {} });

    // A dash, not a guess: a commit from a git push has no entry behind it.
    expect(screen.queryByText('Spring menu')).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('says where a deploy published to', () => {
    renderPage({
      deployments: [
        row({ external_id: 'a', branch: 'main', environment: 'production' }),
        row({ external_id: 'b', branch: 'cms/posts/draft', environment: 'deploy-preview' }),
      ],
    });

    expect(screen.getByText('main · production')).toBeInTheDocument();
    expect(screen.getByText('cms/posts/draft · deploy-preview')).toBeInTheDocument();
  });

  // "main · main" reads as noise where "main" already said it.
  it('does not repeat the branch when the environment adds nothing', () => {
    renderPage({ deployments: [row({ branch: 'main', environment: 'main' })] });

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.queryByText('main · main')).not.toBeInTheDocument();
  });

  it('shows whichever half it has', () => {
    renderPage({
      deployments: [
        row({ external_id: 'a', branch: 'turbo', environment: null }),
        row({ external_id: 'b', branch: null, environment: 'production' }),
      ],
    });

    expect(screen.getByText('turbo')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('surfaces a read failure rather than showing an empty history', () => {
    renderPage({ error: 'Deploy status requires a signed-in session', loaded: false });

    expect(screen.getByText(/requires a signed-in session/)).toBeInTheDocument();
  });
});

describe('deployIndicator', () => {
  it('shows publishing ahead of everything else', () => {
    expect(deployIndicator(1, row()).key).toBe('app.header.deploysPublishing');
  });

  it('names a failed build', () => {
    expect(deployIndicator(0, row({ state: 'failed' })).key).toBe('app.header.deploysFailed');
  });

  // A green dot beside the word "Deploys" leaves the reader to work out what
  // green means.
  it('names the state when the site is live', () => {
    expect(deployIndicator(0, row()).key).toBe('app.header.deploysDeployed');
  });

  it('is plain only when nothing is known yet', () => {
    expect(deployIndicator(0, null).key).toBe('app.header.deploys');
  });

  // The site is still serving the last successful deploy, and a superseded
  // build has lost nothing — its change ships inside the newer one.
  it('counts a superseded deploy as deployed', () => {
    expect(deployIndicator(0, row({ state: 'canceled' })).key).toBe('app.header.deploysDeployed');
  });
});
