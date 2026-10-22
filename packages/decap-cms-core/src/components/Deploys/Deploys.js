import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Icon, colors, lengths, components, shadows, buttons } from 'decap-cms-ui-default';

import { loadDeployHistory, selectCommitUrl } from '../../actions/deployStatus';
import { StatusDot, isStaleDeploy } from '../App/deployStatusIndicator';
import {
  branchOf,
  formatTime,
  liveDeployIds,
  rowId,
  stateColorFor,
  stateKeyFor,
  summaryFor,
  targetOf,
  whereOf,
} from './deploysView';

/**
 * The Deploys page. The band on top answers the editor's "is my
 * change live" first; the table below answers the developer's "which build, why did it fail".
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
    branch: PropTypes.string,
    loadDeployHistory: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Opening the page is one of only three things that may cause a read.
    this.props.loadDeployHistory();
    this.startAutoRefresh();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    this.stopAutoRefresh();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // The only repeating read: it stops when the editor leaves the page, so an idle CMS still polls
  // zero times. `silent` so Refresh does not flicker to "Refreshing…" every ten seconds.
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

  renderRow(row, liveIds, now) {
    const { commitUrls, entryLabels, branch, t } = this.props;
    const stateKey = stateKeyFor(row, liveIds, now);
    const color = stateColorFor(row, now);
    // "Live" on another branch is true of that branch's own URL only, not the published site.
    const onOtherBranch = Boolean(branch) && Boolean(branchOf(row)) && branchOf(row) !== branch;
    const title = isStaleDeploy(row, now)
      ? t('ui.deploys.stalledHint')
      : stateKey === 'ui.deploys.state.live' && onOtherBranch
      ? t('ui.deploys.liveOnBranchHint')
      : undefined;
    const commit = <Commit>{row.commit_sha.slice(0, 7)}</Commit>;

    return (
      <tr key={rowId(row)}>
        <td>
          <StateCell color={color} title={title}>
            <StatusDot color={color} />
            {row.target_url ? (
              <StateLink href={row.target_url} target="_blank" rel="noopener noreferrer">
                {t(stateKey)}
              </StateLink>
            ) : (
              t(stateKey)
            )}
          </StateCell>
          {row.error_message && <ErrorText>{row.error_message}</ErrorText>}
        </td>
        {/* The entry's title, as the "your change is live" notification shows it. */}
        <td>{entryLabels[row.commit_sha] || <Muted as="span">—</Muted>}</td>
        <td>{whereOf(row)}</td>
        <td>{targetOf(row)}</td>
        <td>
          {/* Never the deployed site: that looks like it shows the change and shows the home page. */}
          {commitUrls[row.commit_sha] ? (
            <a href={commitUrls[row.commit_sha]} target="_blank" rel="noopener noreferrer">
              {commit}
            </a>
          ) : (
            commit
          )}
        </td>
        <td>{formatTime(row.finished_at || row.updated_at)}</td>
      </tr>
    );
  }

  render() {
    const { deployments, pendingCount, latest, isFetching, loaded, error, t } = this.props;

    // One clock per render, so a row cannot be fresh at the top and stale further down.
    const now = Date.now();
    const summary = summaryFor(pendingCount, latest, now);
    const targets = [...new Set(deployments.map(targetOf))].sort();
    const liveIds = liveDeployIds(deployments);
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
            // Teaches rather than shrugs: a host that reports nothing is the most likely reason
            // someone opened this page.
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
              <tbody>{deployments.map(row => this.renderRow(row, liveIds, now))}</tbody>
            </Table>
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
