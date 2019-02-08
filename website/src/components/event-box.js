import React from 'react';
import styled from '@emotion/styled';

import EventWidget from './event-widget';
import Markdownify from './markdownify';

import theme from '../theme';

const Root = styled.div`
  text-align: center;
  background: ${theme.colors.darkerGray};
  background-image: linear-gradient(
    -17deg,
    ${theme.colors.darkerGray} 17%,
    ${theme.colors.darkGray} 94%
  );
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;

  max-width: 446px;
`;

const Title = styled.h2`
  color: white;
`;

const Cal = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  margin: 24px auto;
  max-width: 250px;
`;

const Month = styled.div`
  background: ${theme.colors.green};
  color: ${theme.colors.gray};
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 14px;
  padding: 8px;
`;

const Day = styled.div`
  font-size: 104px;
  font-weight: bold;
  color: white;
  border: 1px solid ${theme.colors.gray};
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`;

const CalDates = styled.p`
  color: white;
  font-weight: bold;
  font-size: ${theme.fontsize[4]};
  margin-bottom: ${theme.space[3]};
`;

const CalCta = styled.div``;

const EventBox = ({ title, cta }) => (
  <Root>
    <Title>{title}</Title>
    <EventWidget>
      {({ month, day, datePrefix, dateSuffix }) => (
        <div>
          <Cal>
            <Month>{month}</Month>
            <Day>{day}</Day>
          </Cal>
          <CalDates>
            {datePrefix} at {dateSuffix} PT
          </CalDates>
        </div>
      )}
    </EventWidget>

    <CalCta>
      <Markdownify source={cta} />
    </CalCta>
  </Root>
);

export default EventBox;
