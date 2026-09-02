import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';
import { Icon, colors, lengths, components, shadows, buttons } from 'decap-cms-ui-default';

import { loadDeployHistory } from '../../actions/deployStatus';
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
 * A target is `(source, provider_label)` — who reported, not what deployed.
 * Naming them is what makes a site published to several hosts legible rather
 * than one confusing stream (§A7).
 */
function targetOf(row, t) {
  return row.provider_label || t(row.source === 'webhook' ? 'ui.deploys.webhook' : 'ui.deploys.gitProvider');
}

export class Deploys extends React.Component {
  static propTypes = {
    deployments: PropTypes.array.isRequired,
    pendingCount: PropTypes.number.isRequired,
    latest: PropTypes.object,
    isFetching: PropTypes.bool.isRequired,
    loaded: PropTypes.bool.isRequired,
    error: PropTypes.string,
    loadDeployHistory: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Opening the page is an explicit request for current information, and
    // is one of only two things that may cause a read (§A8).
    this.props.loadDeployHistory();
  }

  render() {
    const { deployments, pendingCount, latest, isFetching, loaded, error, t } = this.props;
    const summary = summaryFor(pendingCount, latest);
    const targets = [...new Set(deployments.map(row => targetOf(row, t)))];
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
                        {t(`ui.deploys.state.${row.state}`)}
                      </StateCell>
                      {row.error_message && <ErrorText>{row.error_message}</ErrorText>}
                    </td>
                    <td>{targetOf(row, t)}</td>
                    <td>
                      {row.target_url ? (
                        <a href={row.target_url} target="_blank" rel="noopener noreferrer">
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
  const { deployments, pendingCount, latest, isFetching, error, loaded } = state.deployStatus;
  return { deployments, pendingCount, latest, isFetching, error, loaded };
}

const mapDispatchToProps = {
  loadDeployHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(Deploys));
