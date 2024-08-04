import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  Icon,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
} from 'decap-cms-ui-next';
import { components } from 'decap-cms-ui-default';

import { fetchPageviews } from '../../../actions/analytics';
import { selectPageviews, selectInterval, selectPeriod } from '../../../reducers/analytics';
import AnalyticsChart from './AnalyticsChart';

const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const AnalyticsHeading = styled.h2`
  ${components.cardTopHeading};
`;

function Analytics({ t }) {
  const dispatch = useDispatch();
  const pageviews = useSelector(selectPageviews);
  const period = useSelector(selectPeriod);
  const interval = useSelector(selectInterval);

  const [currentPeriod, setCurrentPeriod] = useState(period);

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchPageviews(period, interval));
  }, []);

  useEffect(() => {
    // Fetch data when period or interval changes
    dispatch(fetchPageviews(period, interval));
  }, [period, interval, dispatch]);

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <AnalyticsHeading>
          <Icon size="md" name="bar-chart" />
          {t('dashboard.siteAnalytics.title')}
        </AnalyticsHeading>

        <Dropdown>
          <DropdownTrigger>
            <Button hasMenu>{t(`dashboard.siteAnalytics.periodOptions.${period}`)}</Button>
          </DropdownTrigger>

          <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
            {/* {creatableCollections.map(collection => (
              <DropdownMenuItem
                key={collection.get('name')}
                icon={collection.get('icon') || 'file-text'}
                onClick={() => {
                  handleCreatePostClick(collection.get('name'));
                }}
              >
                {t('collection.collectionTop.newButton', {
                  collectionLabel: collection.get('label_singular') || collection.get('label'),
                })}
              </DropdownMenuItem>
            ))} */}
          </DropdownMenu>
        </Dropdown>
      </AnalyticsHeader>

      <AnalyticsChart data={pageviews} />
    </AnalyticsContainer>
  );
}

Analytics.propTypes = {
  t: PropTypes.func.isRequired,
};

export default translate()(Analytics);
