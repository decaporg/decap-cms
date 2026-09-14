import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Deploys, { Deploys as UnconnectedDeploys } from '../Deploys';
import { deployIndicator } from '../../App/deployStatusIndicator';
import en from '../../../../../decap-cms-locales/src/en';

const mockStore = configureStore([thunk]);

/**
 * The table, and only the table.
 *
 * The filter selects list every branch, state and reporter present, so a bare
 * `getByText('Netlify')` now finds the option as well as the cell. Scoping says
 * which one the assertion is about instead of relying on there being one.
 */
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

    expect(table().getAllByText('Live')).toHaveLength(1);
    expect(table().getAllByText('Deployed')).toHaveLength(2);
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

    expect(table().getByText('Failed')).toBeInTheDocument();
    expect(table().getAllByText('Live')).toHaveLength(1);
    expect(table().getAllByText('Deployed')).toHaveLength(1);
  });

  // Every branch has a URL, and its newest success is what that URL serves.
  // Marking only the site's left every other branch's current deploy sitting
  // in a column of "Deployed" with nothing saying which one is current.
  it('calls the newest success of each branch Live', () => {
    renderPage({
      branch: 'turbo',
      deployments: [
        row({ external_id: 'workflow-new', branch: 'cms/posts/some-entry' }),
        row({ external_id: 'workflow-old', branch: 'cms/posts/some-entry' }),
        row({ external_id: 'site', branch: 'turbo' }),
      ],
    });

    // One per branch, not one per table.
    expect(table().getAllByText('Live')).toHaveLength(2);
    expect(table().getAllByText('Deployed')).toHaveLength(1);
    expect(table().getByText('turbo').closest('tr')).toHaveTextContent('Live');
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

  // A host that reports no branch at all must not be locked out of ever being
  // live — that would be every site whose webhook omits the field.
  it('still calls a branchless deploy Live', () => {
    renderPage({
      branch: 'turbo',
      deployments: [row({ external_id: 'nameless', branch: null })],
    });

    expect(table().getAllByText('Live')).toHaveLength(1);
  });

  // Rows that name no branch are one group, not one group each — otherwise a
  // host that reports no branch would have every success called Live.
  it('groups branchless rows together', () => {
    renderPage({
      branch: null,
      deployments: [
        row({ external_id: 'newest' }),
        row({ external_id: 'older' }),
        row({ external_id: 'oldest' }),
      ],
    });

    expect(table().getAllByText('Live')).toHaveLength(1);
    expect(table().getAllByText('Deployed')).toHaveLength(2);
  });

  it('names the git forge rather than saying "Git provider"', () => {
    renderPage({
      deployments: [
        row({ external_id: 'a', source: 'github_deployment', provider_label: null }),
        row({ external_id: 'b', source: 'gitlab_pipeline', provider_label: null }),
      ],
    });

    expect(table().getByText('GitHub')).toBeInTheDocument();
    expect(table().getByText('GitLab')).toBeInTheDocument();
    expect(table().queryByText('Git provider')).not.toBeInTheDocument();
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

    expect(table().getByText('main')).toBeInTheDocument();
    expect(table().queryByText('main · main')).not.toBeInTheDocument();
  });

  it('shows whichever half it has', () => {
    renderPage({
      deployments: [
        row({ external_id: 'a', branch: 'turbo', environment: null }),
        row({ external_id: 'b', branch: null, environment: 'production' }),
      ],
    });

    expect(table().getByText('turbo')).toBeInTheDocument();
    expect(table().getByText('production')).toBeInTheDocument();
  });

  // A build nobody has mentioned for half an hour is not "Building". Measured
  // on the tester: publishing an editorial-workflow entry deletes the `cms/…`
  // branch, orphaning the Deploy Preview still building for it — Netlify
  // leaves that deploy in `uploaded` rather than `ready`, so no notification
  // ever fires. Two rows sat at "Building" for seventeen hours.
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

    // The pill is the surface an editor watches while they wait, so it is the
    // one place where "Building" for ever costs them the most.
    it('does not let the header pill promise a build that ended', () => {
      const stale = row({ state: 'building', finished_at: null, updated_at: longAgo() });

      expect(deployIndicator(0, stale).key).toBe('app.header.deploys');
      expect(deployIndicator(0, row({ state: 'building', updated_at: justNow() })).key).toBe(
        'app.header.deploysBuilding',
      );
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

  describe('filtering', () => {
    function mixed() {
      return [
        row({ external_id: 'a', branch: 'turbo', provider_label: 'Netlify', state: 'success' }),
        row({
          external_id: 'b',
          branch: 'cms/posts/x',
          provider_label: 'Netlify',
          state: 'failed',
        }),
        row({
          external_id: 'c',
          branch: 'turbo',
          source: 'github_deployment',
          provider_label: 'Vercel',
          state: 'success',
        }),
      ];
    }

    function choose(label, value) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }

    it('filters by who reported the deploy', () => {
      renderPage({ deployments: mixed() });
      choose('Reported by', 'Vercel');

      expect(table().getAllByRole('row')).toHaveLength(2); // header + one
      expect(table().getByText('Vercel')).toBeInTheDocument();
    });

    it('filters by state', () => {
      renderPage({ deployments: mixed() });
      choose('State', 'ui.deploys.state.failed');

      expect(table().getAllByRole('row')).toHaveLength(2);
      expect(table().getByText('Failed')).toBeInTheDocument();
    });

    // The filter keys on the DISPLAYED state. Keying on the host's own left it
    // offering "Succeeded" for what the column calls Live and Deployed, so
    // neither of the two words actually on screen could be filtered for.
    it('offers Live and Deployed separately, as the column shows them', () => {
      renderPage({ deployments: mixed() });

      const options = [...screen.getByLabelText('State').options].map(o => o.textContent);
      expect(options).toEqual(['Any', 'Live', 'Deployed', 'Failed']);
      expect(options.some(label => label.includes('ui.deploys'))).toBe(false);
    });

    it('filters down to just what is live', () => {
      renderPage({ deployments: mixed() });
      choose('State', 'ui.deploys.state.live');

      expect(table().getAllByRole('row')).toHaveLength(2);
      expect(table().getByText('Live')).toBeInTheDocument();
      expect(table().queryByText('Deployed')).not.toBeInTheDocument();
    });

    // Live and Deployed are the same state underneath, so this is the case
    // that proves the filter is reading the column and not the row.
    it('separates two successes that differ only in being current', () => {
      renderPage({ deployments: mixed() });
      choose('State', 'ui.deploys.state.deployed');

      expect(table().getAllByRole('row')).toHaveLength(2);
      expect(table().getByText('Deployed')).toBeInTheDocument();
      expect(table().queryByText('Live')).not.toBeInTheDocument();
    });

    it('filters by branch', () => {
      renderPage({ deployments: mixed() });
      choose('Branch', 'turbo');

      expect(table().getAllByRole('row')).toHaveLength(3);
      expect(table().queryByText('cms/posts/x')).not.toBeInTheDocument();
    });

    // An empty table after a filter must not read like an empty site — that
    // message tells you to go and set up a webhook you already have.
    it('says the filter matched nothing, not that the site has never deployed', () => {
      renderPage({ deployments: mixed() });
      choose('Branch', 'cms/posts/x');
      choose('Reported by', 'Vercel');

      expect(screen.getByText('No deploys match these filters.')).toBeInTheDocument();
      expect(
        screen.queryByText(/Netlify does not report branch or production deploys/),
      ).not.toBeInTheDocument();
    });

    // Which deploy a branch is serving is a fact about the branch, not about
    // what happens to be on screen.
    it('does not re-crown a superseded deploy when the newest is filtered out', () => {
      renderPage({
        deployments: [
          row({ external_id: 'new', branch: 'turbo', provider_label: 'Vercel' }),
          row({ external_id: 'old', branch: 'turbo', provider_label: 'Netlify' }),
        ],
      });
      choose('Reported by', 'Netlify');

      expect(table().queryByText('Live')).not.toBeInTheDocument();
      expect(table().getByText('Deployed')).toBeInTheDocument();
    });
  });

  describe('sorting and paging', () => {
    function many(count) {
      return Array.from({ length: count }, (_, i) =>
        row({
          external_id: `d${i}`,
          branch: `branch-${String(i).padStart(2, '0')}`,
          commit_sha: `sha${String(i).padStart(4, '0')}xyz`,
          finished_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
          updated_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        }),
      );
    }

    function bodyRows() {
      return table().getAllByRole('row').slice(1);
    }

    it('shows one page at a time and says how much there is', () => {
      renderPage({ deployments: many(45) });

      expect(bodyRows()).toHaveLength(20);
      expect(screen.getByText('Showing 1–20 of 45')).toBeInTheDocument();
    });

    it('pages forward and back', () => {
      renderPage({ deployments: many(45) });

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Showing 41–45 of 45')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument();
    });

    it('changes the page size', () => {
      renderPage({ deployments: many(45) });
      fireEvent.change(screen.getByLabelText('Per page'), { target: { value: '50' } });

      expect(bodyRows()).toHaveLength(45);
      expect(screen.queryByText(/Showing 1–20/)).not.toBeInTheDocument();
    });

    // Page four of a filter that now has two pages shows an empty table, which
    // reads as "the filter matched nothing".
    it('returns to the first page when the view changes', () => {
      renderPage({ deployments: many(45) });
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Per page'), { target: { value: '50' } });
      expect(screen.getByText('Showing 1–45 of 45')).toBeInTheDocument();
    });

    it('sorts by when, newest first, and reverses on a second click', () => {
      renderPage({ deployments: many(3) });

      expect(bodyRows()[0]).toHaveTextContent('branch-02');

      fireEvent.click(screen.getByRole('button', { name: /When/ }));
      expect(bodyRows()[0]).toHaveTextContent('branch-00');
    });

    it('sorts by branch', () => {
      renderPage({
        deployments: [
          row({ external_id: 'a', branch: 'zebra' }),
          row({ external_id: 'b', branch: 'alpha' }),
        ],
      });

      fireEvent.click(screen.getByRole('button', { name: /Published to/ }));
      expect(bodyRows()[0]).toHaveTextContent('alpha');
    });

    it('sorts by the entry that was saved', () => {
      renderPage({
        deployments: [
          row({ external_id: 'a', commit_sha: 'aaa1111' }),
          row({ external_id: 'b', commit_sha: 'bbb2222' }),
        ],
        entryLabels: { aaa1111: 'Zebra post', bbb2222: 'Alpha post' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Saved entry/ }));
      expect(bodyRows()[0]).toHaveTextContent('Alpha post');
    });

    it('sorts by who reported the deploy', () => {
      renderPage({
        deployments: [
          row({ external_id: 'a', provider_label: 'Vercel' }),
          row({ external_id: 'b', provider_label: 'Netlify' }),
        ],
      });

      fireEvent.click(screen.getByRole('button', { name: /Reported by/ }));
      expect(bodyRows()[0]).toHaveTextContent('Netlify');
    });

    it('sorts by commit', () => {
      renderPage({
        deployments: [
          row({ external_id: 'a', commit_sha: 'fff9999aaa' }),
          row({ external_id: 'b', commit_sha: 'aaa1111bbb' }),
        ],
      });

      fireEvent.click(screen.getByRole('button', { name: /Commit/ }));
      expect(bodyRows()[0]).toHaveTextContent('aaa1111');
    });

    // Not alphabetical: "Building, Deployed, Failed, Live" would put what is
    // live in the middle and what is broken above it. Reading down from what
    // is serving now is the order someone scanning this column wants.
    it('sorts state by what it means, not by its first letter', () => {
      renderPage({
        branch: 'turbo',
        deployments: [
          row({ external_id: 'f', branch: 'a-branch', state: 'failed' }),
          row({ external_id: 'live', branch: 'turbo' }),
          row({ external_id: 'old', branch: 'turbo' }),
        ],
      });

      fireEvent.click(screen.getByRole('button', { name: /State/ }));
      expect(bodyRows().map(r => r.textContent.match(/Live|Deployed|Failed/)[0])).toEqual([
        'Live',
        'Deployed',
        'Failed',
      ]);
    });

    // Which one is worth sorting by depends on why you opened the page, and a
    // header that does nothing when clicked is worse than no header at all.
    it('makes every column sortable', () => {
      renderPage({ deployments: many(3) });

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6);
      for (const header of headers) {
        expect(within(header).getByRole('button')).toBeInTheDocument();
        expect(header).toHaveAttribute('aria-sort');
      }
    });

    // A screen reader has no arrow glyph to read, so the direction has to be
    // on the header itself.
    it('tells assistive technology which way the column runs', () => {
      renderPage({ deployments: many(3) });

      expect(screen.getByRole('columnheader', { name: /When/ })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
      expect(screen.getByRole('columnheader', { name: /Published to/ })).toHaveAttribute(
        'aria-sort',
        'none',
      );
    });
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
