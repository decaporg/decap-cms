import styled from '@emotion/styled';
import { components } from 'decap-cms-ui-default';
import { Icon } from 'decap-cms-ui-next';
import PropTypes from 'prop-types';
import React from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

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
  padding: 0 2rem 2rem 2rem;
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

const WorkflowHeading = styled.h2`
  ${components.cardTopHeading};
`;

type DashboardProps = {
  useAnalytics: boolean;
};

function Dashboard({ useAnalytics, t }: DashboardProps) {
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

          <WorkflowContainer>
            <WorkflowHeading>
              <Icon size="md" name="workflow" />
              {t('dashboard.workflow.title')}
            </WorkflowHeading>

            <WorkflowList />
          </WorkflowContainer>
        </BottomContainer>
      </DashboardBody>
    </DashboardContainer>
  );
}

Dashboard.propTypes = {
  useAnalytics: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { analytics } = state;
  const useAnalytics = analytics.implementation;

  return {
    useAnalytics,
  };
}

export default connect(mapStateToProps)(translate()(Dashboard));
