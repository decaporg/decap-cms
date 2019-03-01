import React, { useState, useEffect } from 'react';
import moment from 'moment';
import styled from '@emotion/styled';

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
  padding-top: 40px;
  max-width: 446px;
`;

const Title = styled.h2`
  font-size: 36px;
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
  line-height: 1.3;
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

const EventBox = ({ title, cta }) => {
  const [loading, setLoading] = useState(true);
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    const eventbriteToken = 'C5PX65CJBVIXWWLNFKLO';
    const eventbriteOrganiser = '14281996019';

    const url = `https://www.eventbriteapi.com/v3/events/search/?token=${eventbriteToken}&organizer.id=${eventbriteOrganiser}&expand=venue%27`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const eventDate = data.events[0].start.utc;

        setEventDate(eventDate);
        setLoading(false);
      })
      .catch(err => {
        console.log(err); // eslint-disable-line no-console
        // TODO: set state to show error message

        setLoading(false);
      });
  }, []);

  const eventDateMoment = moment(eventDate);

  const offset = eventDateMoment.isDST() ? -7 : -8;
  const month = eventDateMoment.format('MMMM');
  const day = eventDateMoment.format('DD');
  const datePrefix = eventDateMoment.format('dddd, MMMM Do');
  const dateSuffix = eventDateMoment.utcOffset(offset).format('h a');

  const ellip = <span>&hellip;</span>;

  return (
    <Root>
      <Title>{title}</Title>
      <Cal>
        <Month>{loading ? 'loading' : month}</Month>
        <Day>{loading ? ellip : day}</Day>
      </Cal>
      <CalDates>
        {loading ? (
          ellip
        ) : (
          <span>
            {datePrefix} at {dateSuffix} PT
          </span>
        )}
      </CalDates>
      <CalCta>
        <Markdownify source={cta} />
      </CalCta>
    </Root>
  );
};

export default EventBox;
