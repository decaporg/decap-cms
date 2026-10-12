import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Deploys, { Deploys as UnconnectedDeploys } from '../Deploys';
import en from '../../../../../decap-cms-locales/src/en';

const mockStore = configureStore([thunk]);

function table() {
  return within(screen.getByRole('table'));
}

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
      branch: null,
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

  it('lists deploys with their host, commit and state', () => {
    renderPage({
      latest: row(),
      deployments: [
        row(),
        row({ external_id: 'deploy-2', state: 'failed', error_message: 'Build script failed' }),
      ],
    });

    expect(table().getAllByText('abc1234')).toHaveLength(2);
    expect(table().getAllByText('Netlify')).toHaveLength(2);
    expect(table().getByText('Build script failed')).toBeInTheDocument();
  });

  // Not a failure — the change ships inside a newer deploy.
  it('calls a cancelled deploy superseded, not failed', () => {
    renderPage({ deployments: [row({ state: 'canceled' })], latest: row({ state: 'canceled' }) });

    expect(table().getByText('Superseded')).toBeInTheDocument();
    expect(table().queryByText('Failed')).not.toBeInTheDocument();
  });

  // The single most likely reason someone opens this page.
  it('explains an empty page instead of shrugging at it', () => {
    renderPage({ deployments: [], loaded: true });

    expect(
      screen.getByText(/Netlify does not report branch or production deploys/),
    ).toBeInTheDocument();
  });

  it('names the sources when a site reports from more than one', () => {
    renderPage({
      deployments: [
        row(),
        row({ external_id: 'd2', source: 'github_deployment', provider_label: 'Vercel' }),
      ],
    });

    expect(screen.getByText(/Netlify, Vercel/)).toBeInTheDocument();
  });

  it('does not claim a single source is several', () => {
    renderPage({ deployments: [row(), row({ external_id: 'd2' })] });

    expect(screen.queryByText(/reported from more than one place/)).not.toBeInTheDocument();
  });

  it('reads deploys on mount and again on Refresh', () => {
    // Opening the page and pressing Refresh are two of the three things that may
    // cause a read; nothing else polls.
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

    // The repeating read belongs to this page; leaving it leaves an idle CMS
    // polling zero times.
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

    expect(table().getAllByText('Live')).toHaveLength(1);
    expect(table().getAllByText('Deployed')).toHaveLength(2);
  });

  // The distinction the summary band keeps and a shared word cannot: a `cms/…`
  // branch deploy is live at its own URL and is not the published site.
  it('says which URL a Live on another branch is live at', () => {
    renderPage({
      branch: 'turbo',
      deployments: [
        row({ external_id: 'workflow', branch: 'cms/posts/some-entry' }),
        row({ external_id: 'site', branch: 'turbo' }),
      ],
    });

    const workflowRow = table().getByText('cms/posts/some-entry').closest('tr');
    expect(within(workflowRow).getByTitle(/not the published site/)).toBeInTheDocument();
    // The site's own Live is unqualified — it IS the published site.
    const siteRow = table().getByText('turbo').closest('tr');
    expect(within(siteRow).queryByTitle(/not the published site/)).not.toBeInTheDocument();
  });

  // However many branches the table calls Live, the summary band stays scoped
  // to the site's own. This is the regression that started all of it.
  it('does not let a branch deploy speak for the site', () => {
    renderPage({
      branch: 'turbo',
      // `latest` is what the reducer already scoped to the site branch.
      latest: null,
      deployments: [row({ external_id: 'workflow', branch: 'cms/posts/some-entry' })],
    });

    expect(screen.getByText(/No deploy has been reported/)).toBeInTheDocument();
    expect(screen.queryByText(/Your latest change is live/)).not.toBeInTheDocument();
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

  // A build nobody has mentioned for half an hour is not "Building": a deleted
  // branch's Deploy Preview is never reported again.
  describe('a build that stopped being reported', () => {
    function longAgo() {
      return new Date(Date.now() - 60 * 60 * 1000).toISOString();
    }

    function justNow() {
      return new Date().toISOString();
    }

    it('stops calling it Building', () => {
      renderPage({
        deployments: [row({ state: 'building', finished_at: null, updated_at: longAgo() })],
      });

      expect(table().getByText('Unknown')).toBeInTheDocument();
      expect(table().queryByText('Building')).not.toBeInTheDocument();
    });

    it('says why, rather than leaving the reader to guess', () => {
      renderPage({
        deployments: [row({ state: 'building', finished_at: null, updated_at: longAgo() })],
      });

      expect(table().getByTitle(/nothing has been reported since/)).toBeInTheDocument();
    });

    // The threshold must never overtake a slow but healthy build.
    it('leaves a build that is still being reported alone', () => {
      renderPage({
        deployments: [row({ state: 'building', finished_at: null, updated_at: justNow() })],
      });

      expect(table().getByText('Building')).toBeInTheDocument();
    });

    // Nothing is written back: we did not learn it failed, we learnt we
    // stopped hearing about it, and those are different claims.
    it('does not claim the build failed', () => {
      renderPage({
        deployments: [row({ state: 'building', finished_at: null, updated_at: longAgo() })],
      });

      expect(table().queryByText('Failed')).not.toBeInTheDocument();
    });
  });

  it('surfaces a read failure rather than showing an empty history', () => {
    renderPage({ error: 'Deploy status requires a signed-in session', loaded: false });

    expect(screen.getByText(/requires a signed-in session/)).toBeInTheDocument();
  });
});
