import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Icon, colors, lengths, components, shadows, buttons } from 'decap-cms-ui-default';

import { loadDeployHistory, selectCommitUrl } from '../../actions/deployStatus';
import { DEPLOY_STATE_COLORS, StatusDot, isStaleDeploy } from '../App/deployStatusIndicator';

/**
 * The Deploys page. See decap-turbo/docs/deploy-status-plan.md §A8.
 *
 * Two audiences, deliberately stacked rather than merged. The band at the top
 * answers the editor's question in a sentence — "is my change live" — and the
 * table below answers the developer's — "which build, which commit, why did it
 * fail". Putting the developer detail first would make the page unreadable for
 * the person who needs it most often.
 */

const DeploysContainer = styled.div`
  min-height: 100vh;
  margin: ${lengths.pageMarginMobile};
  @media (min-width: 500px) {
    margin: ${lengths.pageMargin};
  }
`;

const DeploysTop = styled.div`
  ${components.cardTop};
`;

const DeploysTopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const DeploysTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const DeploysTopDescription = styled.p`
  ${components.cardTopDescription};
`;

const RefreshButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.gray};
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const SummaryLink = styled.a`
  ${buttons.button};
  ${buttons.default};
  ${buttons.lightBlue};
  text-decoration: none;
  display: inline-block;
  margin-top: 12px;
`;

const Card = styled.div`
  ${components.card};
  ${shadows.dropMain};
  padding: 16px 20px;
  margin-bottom: 16px;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: ${colors.controlLabel};

  select {
    font-size: 14px;
    padding: 6px 8px;
    border: 1px solid ${colors.textFieldBorder};
    border-radius: ${lengths.borderRadius};
    background-color: ${colors.inputBackground};
    color: ${colors.controlLabel};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid ${colors.textFieldBorder};
    vertical-align: top;
  }

  th {
    color: ${colors.controlLabel};
    font-weight: 600;
    white-space: nowrap;
  }
`;

/**
 * A sortable heading is a button inside the `th` rather than a click handler on
 * the cell: the header has to be reachable and operable from the keyboard, and
 * `aria-sort` on the `th` is what tells a screen reader which way the column
 * currently runs.
 */
const SortButton = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${colors.active};
  }
`;

const Pager = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;

const PagerControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const PagerButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.gray};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const StateCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  color: ${props => props.color};
  font-weight: 600;
`;

const StateLink = styled.a`
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Muted = styled.p`
  color: ${colors.text};
  margin: 0;
`;

const ErrorText = styled.p`
  color: ${colors.errorText};
  margin: 4px 0 0;
  font-weight: 400;
`;

const Commit = styled.code`
  font-family: monospace;
`;

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

function timeOf(row) {
  return Date.parse(row.finished_at || row.updated_at) || 0;
}

/**
 * The one sentence the page exists to say. Publishing wins over everything —
 * an editor with a save in flight is asking about that save, not about a
 * build that finished before it.
 *
 * `latest` is already scoped to the site's own branch by the reducer, so this
 * never speaks for a branch deploy. That scoping is deliberate and is the one
 * place on the page that stays narrow — see `liveDeployIds` for why the table
 * itself is broader.
 */
function summaryFor(pendingCount, latest, now) {
  if (pendingCount > 0) {
    return { key: 'ui.deploys.summaryPublishing', options: { count: pendingCount } };
  }
  if (!latest || isStaleDeploy(latest, now)) {
    return { key: 'ui.deploys.summaryUnknown', options: {} };
  }
  if (latest.state === 'failed') {
    return { key: 'ui.deploys.summaryFailed', options: {} };
  }
  if (latest.state === 'building' || latest.state === 'pending') {
    return { key: 'ui.deploys.summaryBuilding', options: {} };
  }
  if (latest.state === 'success') {
    return {
      key: 'ui.deploys.summaryLive',
      options: { time: formatTime(latest.finished_at || latest.updated_at) },
    };
  }
  return { key: 'ui.deploys.summaryUnknown', options: {} };
}

/**
 * A target is `(source, provider_label)` — who REPORTED the deploy, not
 * necessarily who ran it. Naming them is what makes a site published to
 * several hosts legible rather than one confusing stream (§A7).
 *
 * `provider_label` is the host's own name when we could identify it
 * ("Netlify"). Without one we still know which git forge the report came
 * through, because that is encoded in the source — so this says "GitHub"
 * rather than an unhelpful "Git provider".
 */
function targetOf(row) {
  if (row.provider_label) {
    return row.provider_label;
  }
  if (row.source?.startsWith('github')) {
    return 'GitHub';
  }
  if (row.source?.startsWith('gitlab')) {
    return 'GitLab';
  }
  return 'Webhook';
}

function rowId(row) {
  return `${row.source}:${row.external_id}`;
}

function branchOf(row) {
  return row.branch || '';
}

/**
 * The deploy currently being served, for every branch that has one.
 *
 * Per branch, not once for the whole table: with editorial workflow on there is
 * a `cms/…` branch per unpublished entry, each with its own URL that its own
 * newest successful build is genuinely serving. Marking only the site's meant
 * every other branch's current deploy sat in a column of "Deployed" with
 * nothing saying which of that branch's five builds the URL will show you.
 *
 * Rows arrive newest-first, so the first success per branch is that branch's
 * live one; every earlier success has been superseded.
 *
 * This deliberately does NOT feed the summary band or the header pill, which
 * stay scoped to the site's own branch. "Live" here means "this is what that
 * branch serves"; "your latest change is live" is a claim about the published
 * site, and a preview of an unpublished entry is not that.
 */
export function liveDeployIds(deployments) {
  const seen = new Set();
  const live = new Set();
  for (const row of deployments) {
    if (row.state !== 'success') continue;
    const branch = branchOf(row);
    if (seen.has(branch)) continue;
    seen.add(branch);
    live.add(rowId(row));
  }
  return live;
}

/**
 * What a row's state cell says.
 *
 * `stalled` is ours rather than the host's: a build still marked building long
 * after anything last mentioned it has not failed as far as we know, but
 * "Building" promises that something is still happening.
 */
function stateKeyFor(row, liveIds, now) {
  if (isStaleDeploy(row, now)) {
    return 'ui.deploys.state.stalled';
  }
  if (row.state === 'success') {
    return liveIds.has(rowId(row)) ? 'ui.deploys.state.live' : 'ui.deploys.state.deployed';
  }
  return `ui.deploys.state.${row.state}`;
}

function stateColorFor(row, now) {
  if (isStaleDeploy(row, now)) {
    return DEPLOY_STATE_COLORS.stalled;
  }
  return DEPLOY_STATE_COLORS[row.state] || colors.text;
}

/**
 * Where the deploy published to.
 *
 * Branch and environment answer different halves of it: the branch says which
 * content, the environment says which destination. Netlify will build the same
 * ref as both a production deploy and a branch deploy, and for editorial
 * workflow a Deploy Preview is a third — so neither alone is the answer.
 *
 * Shown together only when they differ, since "main / production" reads as
 * noise where "main" already said it.
 */
function whereOf(row) {
  const branch = row.branch || null;
  const environment = row.environment || null;

  if (branch && environment && environment !== branch) {
    return `${branch} · ${environment}`;
  }
  return branch || environment || '—';
}

/** Poll cadence while the page is open. See §A8 on why only while it is. */
const REFRESH_MS = 10000;

export const PAGE_SIZES = [20, 50, 100];

/** The filter value that means "do not filter on this at all". */
const ANY = '';

/**
 * The order states read in when the State column is sorted, and the order the
 * State filter offers them.
 *
 * Not alphabetical: "Building, Deployed, Failed, Live, Superseded, Unknown"
 * puts what is live in the middle and what is broken above it. Reading down
 * from what is serving now to what never finished is the order someone
 * scanning this column actually wants, and the arrow still reverses it.
 */
const STATE_ORDER = [
  'ui.deploys.state.live',
  'ui.deploys.state.deployed',
  'ui.deploys.state.building',
  'ui.deploys.state.pending',
  'ui.deploys.state.failed',
  'ui.deploys.state.canceled',
  'ui.deploys.state.stalled',
];

/**
 * How each column sorts. Every column, because which one is worth sorting by
 * depends on what you came to the page for, and guessing wrong just means a
 * header that does nothing when clicked.
 *
 * `ctx` carries what the displayed value depends on — the entry labels, and
 * for State the live set and the clock — so the sort orders what is on screen
 * rather than the raw row behind it.
 */
const SORTS = {
  state: (row, ctx) => STATE_ORDER.indexOf(stateKeyFor(row, ctx.liveIds, ctx.now)),
  entry: (row, ctx) => (ctx.entryLabels[row.commit_sha] || '').toLowerCase(),
  branch: row => branchOf(row).toLowerCase(),
  target: row => targetOf(row).toLowerCase(),
  commit: row => (row.commit_sha || '').toLowerCase(),
  when: row => timeOf(row),
};

export class Deploys extends React.Component {
  static propTypes = {
    deployments: PropTypes.array.isRequired,
    pendingCount: PropTypes.number.isRequired,
    latest: PropTypes.object,
    isFetching: PropTypes.bool.isRequired,
    loaded: PropTypes.bool.isRequired,
    error: PropTypes.string,
    commitUrls: PropTypes.object.isRequired,
    entryLabels: PropTypes.object.isRequired,
    branch: PropTypes.string,
    loadDeployHistory: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {
    page: 0,
    pageSize: PAGE_SIZES[0],
    sortKey: 'when',
    sortDir: 'desc',
    filterTarget: ANY,
    filterState: ANY,
    filterBranch: ANY,
  };

  componentDidMount() {
    // Opening the page is an explicit request for current information, and is
    // one of only three things that may cause a read (§A8).
    this.props.loadDeployHistory();
    this.startAutoRefresh();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    this.stopAutoRefresh();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * A build finishing while the page is open should change the page, not wait
   * for someone to reload. This is the one place a repeating read is allowed:
   * it is scoped to a page the editor deliberately opened and stops the moment
   * they leave it, which keeps §A4b's "an idle CMS polls zero times" intact.
   *
   * `silent` so the Refresh button does not flicker to "Refreshing…" every ten
   * seconds on its own.
   */
  startAutoRefresh() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.props.loadDeployHistory({ silent: true });
    }, REFRESH_MS);
  }

  stopAutoRefresh() {
    clearInterval(this.timer);
    this.timer = null;
  }

  // A background tab is not being watched, so it has no reason to keep
  // reading. Coming back is a good moment to read once, immediately.
  handleVisibilityChange = () => {
    if (document.hidden) {
      this.stopAutoRefresh();
    } else {
      this.props.loadDeployHistory({ silent: true });
      this.startAutoRefresh();
    }
  };

  // Any change to what is being shown returns to the first page. Staying on
  // page four of a filter that now has two pages shows an empty table, which
  // reads as "the filter matched nothing".
  setView = patch => {
    this.setState({ page: 0, ...patch });
  };

  toggleSort = key => {
    this.setView({
      sortKey: key,
      // Time reads newest-first and names read A–Z; both are what someone
      // means by the first click.
      sortDir:
        this.state.sortKey === key
          ? this.state.sortDir === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'when'
          ? 'desc'
          : 'asc',
    });
  };

  /** The rows the current filters and sort select, before paging. */
  visibleRows(ctx) {
    const { deployments } = this.props;
    const { sortKey, sortDir, filterTarget, filterState, filterBranch } = this.state;

    const filtered = deployments.filter(row => {
      if (filterTarget !== ANY && targetOf(row) !== filterTarget) return false;
      // Against the DISPLAYED state, not `row.state`. The table says Live and
      // Deployed, and a filter that offered neither — because both are
      // `success` underneath — asked the reader to translate the column back
      // into the host's vocabulary before they could use it.
      if (filterState !== ANY && stateKeyFor(row, ctx.liveIds, ctx.now) !== filterState) {
        return false;
      }
      if (filterBranch !== ANY && branchOf(row) !== filterBranch) return false;
      return true;
    });

    const read = SORTS[sortKey] ?? SORTS.when;
    const direction = sortDir === 'asc' ? 1 : -1;
    // Sorting a copy: `deployments` is the store's own array, and sorting in
    // place would mutate state other components read.
    return [...filtered].sort((a, b) => {
      const left = read(a, ctx);
      const right = read(b, ctx);
      if (left === right) {
        // Ties settle by time, so a branch with six builds still reads in a
        // sensible order rather than whatever order the store happened to hold.
        return timeOf(b) - timeOf(a);
      }
      return left > right ? direction : -direction;
    });
  }

  renderSortHeader(key, labelKey) {
    const { t } = this.props;
    const active = this.state.sortKey === key;
    const ascending = this.state.sortDir === 'asc';
    return (
      <th aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}>
        <SortButton type="button" onClick={() => this.toggleSort(key)}>
          {t(labelKey)}
          {active && <span aria-hidden="true">{ascending ? '▲' : '▼'}</span>}
        </SortButton>
      </th>
    );
  }

  renderControls(branches, targets, stateKeys) {
    const { t } = this.props;
    const { filterTarget, filterState, filterBranch } = this.state;
    return (
      <Controls>
        <Field>
          {t('ui.deploys.columnTarget')}
          <select
            value={filterTarget}
            onChange={event => this.setView({ filterTarget: event.target.value })}
          >
            <option value={ANY}>{t('ui.deploys.filterAny')}</option>
            {targets.map(target => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t('ui.deploys.columnState')}
          <select
            value={filterState}
            onChange={event => this.setView({ filterState: event.target.value })}
          >
            <option value={ANY}>{t('ui.deploys.filterAny')}</option>
            {stateKeys.map(key => (
              <option key={key} value={key}>
                {/*
                  Keyed on the DISPLAYED state, so the filter offers exactly
                  the words in the column — Live and Deployed included, even
                  though the host calls both of them `success`.
                */}
                {t(key)}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          {t('ui.deploys.filterBranch')}
          <select
            value={filterBranch}
            onChange={event => this.setView({ filterBranch: event.target.value })}
          >
            <option value={ANY}>{t('ui.deploys.filterAny')}</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>
                {branch || t('ui.deploys.branchUnknown')}
              </option>
            ))}
          </select>
        </Field>
      </Controls>
    );
  }

  renderPager(total) {
    const { t } = this.props;
    const { page, pageSize } = this.state;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : page * pageSize + 1;
    const last = Math.min(total, (page + 1) * pageSize);

    return (
      <Pager>
        <Muted as="span">{t('ui.deploys.pageRange', { first, last, total })}</Muted>
        <PagerControls>
          <Field>
            {t('ui.deploys.perPage')}
            <select
              value={pageSize}
              onChange={event => this.setView({ pageSize: Number(event.target.value) })}
            >
              {PAGE_SIZES.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </Field>
          <PagerButton
            type="button"
            disabled={page === 0}
            onClick={() => this.setState({ page: page - 1 })}
          >
            {t('ui.deploys.previousPage')}
          </PagerButton>
          <PagerButton
            type="button"
            disabled={page >= pages - 1}
            onClick={() => this.setState({ page: page + 1 })}
          >
            {t('ui.deploys.nextPage')}
          </PagerButton>
        </PagerControls>
      </Pager>
    );
  }

  render() {
    const {
      deployments,
      pendingCount,
      latest,
      isFetching,
      loaded,
      error,
      commitUrls,
      entryLabels,
      branch,
      t,
    } = this.props;
    const { page, pageSize } = this.state;

    // Read once per render, so every row in one paint is judged against the
    // same clock — a row cannot be fresh at the top of the table and stale
    // further down.
    const now = Date.now();

    const summary = summaryFor(pendingCount, latest, now);
    const targets = [...new Set(deployments.map(targetOf))].sort();
    const branches = [...new Set(deployments.map(branchOf))].sort();
    // Computed over everything rather than over the visible page: which deploy
    // a branch is serving does not change because someone turned to page two.
    const liveIds = liveDeployIds(deployments);
    const ctx = { entryLabels, liveIds, now };
    // The states the table actually shows, in reading order — so the filter
    // offers Live and Deployed rather than the `success` they share.
    const stateKeys = [...new Set(deployments.map(row => stateKeyFor(row, liveIds, now)))].sort(
      (a, b) => STATE_ORDER.indexOf(a) - STATE_ORDER.indexOf(b),
    );
    const liveUrl = latest && latest.state === 'success' ? latest.target_url : null;

    const sorted = this.visibleRows(ctx);
    const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize);

    return (
      <DeploysContainer>
        <DeploysTop>
          <DeploysTopRow>
            <DeploysTopHeading>{t('ui.deploys.heading')}</DeploysTopHeading>
            <RefreshButton onClick={() => this.props.loadDeployHistory()} disabled={isFetching}>
              <Icon type="refresh" size="small" />
              {t(isFetching ? 'ui.deploys.refreshing' : 'ui.deploys.refresh')}
            </RefreshButton>
          </DeploysTopRow>
          <DeploysTopDescription>{t(summary.key, summary.options)}</DeploysTopDescription>
          {liveUrl && (
            <SummaryLink href={liveUrl} target="_blank" rel="noopener noreferrer">
              {t('ui.deploys.viewSite')}
            </SummaryLink>
          )}
        </DeploysTop>

        {error && (
          <Card>
            <ErrorText>{t('ui.deploys.loadError', { details: error })}</ErrorText>
          </Card>
        )}

        {targets.length > 1 && (
          <Card>
            <Muted>{t('ui.deploys.multipleTargets', { targets: targets.join(', ') })}</Muted>
          </Card>
        )}

        <Card>
          {deployments.length === 0 ? (
            // The empty state teaches rather than shrugs: "nothing here" is
            // exactly what a site whose host reports nothing will always show,
            // and that is the single most likely reason someone opened this
            // page (§A6).
            <Muted>{t(loaded ? 'ui.deploys.emptyConfigured' : 'ui.deploys.emptyUnknown')}</Muted>
          ) : (
            <>
              {this.renderControls(branches, targets, stateKeys)}
              {sorted.length === 0 ? (
                <Muted>{t('ui.deploys.emptyFiltered')}</Muted>
              ) : (
                <>
                  <Table>
                    <thead>
                      <tr>
                        {this.renderSortHeader('state', 'ui.deploys.columnState')}
                        {this.renderSortHeader('entry', 'ui.deploys.columnEntry')}
                        {this.renderSortHeader('branch', 'ui.deploys.columnWhere')}
                        {this.renderSortHeader('target', 'ui.deploys.columnTarget')}
                        {this.renderSortHeader('commit', 'ui.deploys.columnCommit')}
                        {this.renderSortHeader('when', 'ui.deploys.columnWhen')}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map(row => {
                        const stateKey = stateKeyFor(row, liveIds, now);
                        const color = stateColorFor(row, now);
                        // "Live" on a branch that is not the site's is true of
                        // that branch's own URL and only that. Say so, rather
                        // than let it read as the site serving a preview of an
                        // entry nobody has published.
                        const onOtherBranch =
                          Boolean(branch) && Boolean(branchOf(row)) && branchOf(row) !== branch;
                        const title = isStaleDeploy(row, now)
                          ? t('ui.deploys.stalledHint')
                          : stateKey === 'ui.deploys.state.live' && onOtherBranch
                          ? t('ui.deploys.liveOnBranchHint')
                          : undefined;
                        return (
                          <tr key={rowId(row)}>
                            <td>
                              <StateCell color={color} title={title}>
                                <StatusDot color={color} />
                                {/*
                                  The link is the deploy's own — the site for a
                                  success, the build log for a failure.
                                */}
                                {row.target_url ? (
                                  <StateLink
                                    href={row.target_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {t(stateKey)}
                                  </StateLink>
                                ) : (
                                  t(stateKey)
                                )}
                              </StateCell>
                              {row.error_message && <ErrorText>{row.error_message}</ErrorText>}
                            </td>
                            <td>
                              {/*
                                The same value the "your change is live"
                                notification shows — the entry's title, not the
                                commit message, which carries the slug. Blank
                                for a commit the CMS did not make, or one made
                                before this was recorded.
                              */}
                              {entryLabels[row.commit_sha] || <Muted as="span">—</Muted>}
                            </td>
                            <td>{whereOf(row)}</td>
                            <td>{targetOf(row)}</td>
                            <td>
                              {/*
                                A commit that links to the deployed site looks
                                like it will show you the change and shows you
                                the home page. Either the commit itself, or
                                plain text.
                              */}
                              {commitUrls[row.commit_sha] ? (
                                <a
                                  href={commitUrls[row.commit_sha]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Commit>{row.commit_sha.slice(0, 7)}</Commit>
                                </a>
                              ) : (
                                <Commit>{row.commit_sha.slice(0, 7)}</Commit>
                              )}
                            </td>
                            <td>{formatTime(row.finished_at || row.updated_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {this.renderPager(sorted.length)}
                </>
              )}
            </>
          )}
        </Card>
      </DeploysContainer>
    );
  }
}

function mapStateToProps(state) {
  const { deployments, pendingCount, latest, isFetching, error, loaded, entryLabels, branch } =
    state.deployStatus;

  // Derived rather than stored: it depends only on the backend, and keeping a
  // copy in the store would be one more thing that can go stale.
  const commitUrls = {};
  for (const row of deployments) {
    if (!(row.commit_sha in commitUrls)) {
      commitUrls[row.commit_sha] = selectCommitUrl(state, row.commit_sha);
    }
  }

  return {
    deployments,
    pendingCount,
    latest,
    isFetching,
    error,
    loaded,
    commitUrls,
    entryLabels,
    branch,
  };
}

const mapDispatchToProps = {
  loadDeployHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(Deploys));
