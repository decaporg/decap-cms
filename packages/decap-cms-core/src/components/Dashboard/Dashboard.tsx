import styled from '@emotion/styled';
import { components } from 'decap-cms-ui-default';
import { Button, Icon } from 'decap-cms-ui-next';
import { OrderedMap } from 'immutable';
import PropTypes from 'prop-types';
import { NavLink as ReactRouterNavLink } from 'react-router-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React, { useEffect } from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { selectUnpublishedEntriesByStatus } from '../../reducers';
import { loadUnpublishedEntries } from '../../actions/editorialWorkflow';
import { EDITORIAL_WORKFLOW, status } from '../../constants/publishModes';
import WorkflowList from './Workflow/WorkflowList';
import Analytics from './Analytics/Analytics';
import NoAnalytics from './Analytics/NoAnalytics';
import RecentActivityList from './RecentActivity/RecentActivityList';
connect;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  height: 100%;
  padding: 1rem;
`;

const DashboardHeading = styled.h1`
  ${components.cardTopHeading};
`;

const DashboardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  flex: 1;
  height: calc(100% - 4rem);
`;

const AnalyticsContainer = styled.div`
  display: flex;
  flex: 1;
`;

const RecentActivityContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
`;

const RecentActivityHeading = styled.h2`
  ${components.cardTopHeading};
`;

const BottomContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
`;

const WorkflowContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const WorkflowHeading = styled.h2`
  ${components.cardTopHeading};
`;

function Dashboard({
  unpublishedEntries,
  loadUnpublishedEntries,
  isEditorialWorkflow,
  useAnalytics,
  t,
}) {
  useEffect(() => {
    if (isEditorialWorkflow) {
      loadUnpublishedEntries();
    }
  }, []);

  return (
    <DashboardContainer>
      <DashboardHeading>
        <Icon size="lg" name="layout" />
        {t('dashboard.title')}
      </DashboardHeading>

      <DashboardBody>
        <AnalyticsContainer>{useAnalytics ? <Analytics /> : <NoAnalytics />}</AnalyticsContainer>

        <BottomContainer>
          <RecentActivityContainer>
            <RecentActivityHeading>
              <Icon size="md" name="bar-chart" />
              {t('dashboard.recentActivity.title')}
            </RecentActivityHeading>
            <RecentActivityList />
          </RecentActivityContainer>

          {isEditorialWorkflow && (
            <WorkflowContainer>
              <WorkflowHeader>
                <WorkflowHeading>
                  <Icon size="md" name="workflow" />
                  {t('dashboard.workflow.title')}
                </WorkflowHeading>

                <Button
                  as={ReactRouterNavLink}
                  to={'/workflow'}
                  type="neutral"
                  variant="soft"
                  size="sm"
                >
                  {t('dashboard.workflow.action')}
                </Button>
              </WorkflowHeader>

              <WorkflowList entries={unpublishedEntries} t={t} />
            </WorkflowContainer>
          )}
        </BottomContainer>
      </DashboardBody>
    </DashboardContainer>
  );
}

Dashboard.propTypes = {
  useAnalytics: PropTypes.bool,
  t: PropTypes.func.isRequired,
  useAnalytics: PropTypes.bool,
  unpublishedEntries: ImmutablePropTypes.map,
  loadUnpublishedEntries: PropTypes.func.isRequired,
  isEditorialWorkflow: PropTypes.bool,
};

function mapStateToProps(state) {
  const { config, globalUI, analytics } = state;
  const useAnalytics = analytics.implementation;
  const isEditorialWorkflow = config.publish_mode === EDITORIAL_WORKFLOW;
  const isOpenAuthoring = globalUI.useOpenAuthoring;

  const returnObj = { isEditorialWorkflow, isOpenAuthoring, useAnalytics };

  if (isEditorialWorkflow) {
    returnObj.isFetching = state.editorialWorkflow.getIn(['pages', 'isFetching'], false);

    /*
     * Generates an ordered Map of the available status as keys.
     * Each key containing a Sequence of available unpubhlished entries
     * Eg.: OrderedMap{'draft':Seq(), 'pending_review':Seq(), 'pending_publish':Seq()}
     */
    returnObj.unpublishedEntries = status.reduce((acc, currStatus) => {
      const entries = selectUnpublishedEntriesByStatus(state, currStatus);
      return acc.set(currStatus, entries);
    }, OrderedMap());
  }

  return returnObj;
}

const mapDispatchToProps = {
  loadUnpublishedEntries,
};

const ConnectedDashboard = connect(mapStateToProps, mapDispatchToProps)(Dashboard);

export default translate()(ConnectedDashboard);
