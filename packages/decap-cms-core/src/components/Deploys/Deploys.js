import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Icon, colors, lengths, components, shadows, buttons } from 'decap-cms-ui-default';

import { loadDeployHistory, selectCommitUrl } from '../../actions/deployStatus';
import { DEPLOY_STATE_COLORS, StatusDot } from '../App/deployStatusIndicator';

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

/**
 * The one sentence the page exists to say. Publishing wins over everything —
 * an editor with a save in flight is asking about that save, not about a
 * build that finished before it.
 */
function summaryFor(pendingCount, latest) {
  if (pendingCount > 0) {
    return { key: 'ui.deploys.summaryPublishing', options: { count: pendingCount } };
  }
  if (!latest) {
    return { key: 'ui.deploys.summaryUnknown', options: {} };
  }
  if (latest.state === 'failed') {
    return { key: 'ui.deploys.summaryFailed', options: {} };
  }
  if (latest.state === 'building' || latest.state === 'pending') {
    return { key: 'ui.deploys.summaryBuilding', options: {} };
  }
  if (latest.state === 'success') {
    return { key: 'ui.deploys.summaryLive', options: { time: formatTime(latest.finished_at || latest.updated_at) } };
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

/**
 * Only one deploy is live at a time, and it is the most recent successful one
 * — later successes supersede earlier ones. Every other success was live once
 * and no longer is, so calling them all "Live" is simply untrue.
 *
 * Rows arrive newest-first, so the first success is the live one. A rollback
 * on the host would defeat this, and the host's own dashboard is authoritative
 * there; the alternative is calling nothing live, which is less useful and no
 * more correct.
 */
function stateKeyFor(row, liveId) {
  if (row.state === 'success') {
    return `${row.source}:${row.external_id}` === liveId
      ? 'ui.deploys.state.live'
      : 'ui.deploys.state.deployed';
  }
  return `ui.deploys.state.${row.state}`;
}

function liveDeployId(deployments) {
  const live = deployments.find(row => row.state === 'success');
  return live ? `${live.source}:${live.external_id}` : null;
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
    loadDeployHistory: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
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
      t,
    } = this.props;
    const summary = summaryFor(pendingCount, latest);
    const targets = [...new Set(deployments.map(targetOf))];
    const liveId = liveDeployId(deployments);
    const liveUrl = latest && latest.state === 'success' ? latest.target_url : null;

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
            <Table>
              <thead>
                <tr>
                  <th>{t('ui.deploys.columnState')}</th>
                  <th>{t('ui.deploys.columnEntry')}</th>
                  <th>{t('ui.deploys.columnWhere')}</th>
                  <th>{t('ui.deploys.columnTarget')}</th>
                  <th>{t('ui.deploys.columnCommit')}</th>
                  <th>{t('ui.deploys.columnWhen')}</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map(row => (
                  <tr key={`${row.source}:${row.external_id}`}>
                    <td>
                      <StateCell color={DEPLOY_STATE_COLORS[row.state] || colors.text}>
                        <StatusDot color={DEPLOY_STATE_COLORS[row.state] || colors.text} />
                        {/*
                          Only the newest success is actually live; the rest
                          were live once. The link is the deploy's own — the
                          site for a success, the build log for a failure.
                        */}
                        {row.target_url ? (
                          <StateLink href={row.target_url} target="_blank" rel="noopener noreferrer">
                            {t(stateKeyFor(row, liveId))}
                          </StateLink>
                        ) : (
                          t(stateKeyFor(row, liveId))
                        )}
                      </StateCell>
                      {row.error_message && <ErrorText>{row.error_message}</ErrorText>}
                    </td>
                    <td>
                      {/*
                        The same value the "your change is live" notification
                        shows — the entry's title, not the commit message,
                        which carries the slug. Blank for a commit the CMS did
                        not make, or one made before this was recorded.
                      */}
                      {entryLabels[row.commit_sha] || <Muted as="span">—</Muted>}
                    </td>
                    <td>{whereOf(row)}</td>
                    <td>{targetOf(row)}</td>
                    <td>
                      {/*
                        A commit that links to the deployed site looks like it
                        will show you the change and shows you the home page.
                        Either the commit itself, or plain text.
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
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </DeploysContainer>
    );
  }
}

function mapStateToProps(state) {
  const { deployments, pendingCount, latest, isFetching, error, loaded, entryLabels } =
    state.deployStatus;

  // Derived rather than stored: it depends only on the backend, and keeping a
  // copy in the store would be one more thing that can go stale.
  const commitUrls = {};
  for (const row of deployments) {
    if (!(row.commit_sha in commitUrls)) {
      commitUrls[row.commit_sha] = selectCommitUrl(state, row.commit_sha);
    }
  }

  return { deployments, pendingCount, latest, isFetching, error, loaded, commitUrls, entryLabels };
}

const mapDispatchToProps = {
  loadDeployHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(Deploys));
