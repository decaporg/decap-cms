import React from 'react';
import moment from 'moment';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import Container from './container';
import Markdownify from '../components/markdownify';
import { mq } from '../utils';
import theme from '../theme';

const ReleaseItem = styled.li``;
const Version = styled.span`
  background: ${theme.colors.shadeBlue};
  font-size: ${theme.fontsize[1]};
  padding: 0 ${theme.space[1]};
  border-radius: ${theme.radii[1]};
  color: ${theme.colors.darkGray};
  font-weight: 700;
  margin-right: ${theme.space[2]};
  color: ${theme.colors.gray};
`;

const ReleaseLink = styled.a`
  color: white;
  display: block;
  padding: ${theme.space[2]} ${theme.space[3]};
  border-radius: ${theme.radii[1]};

  &:hover {
    background: ${theme.colors.darkGray};
  }
`;

const DisplayDate = styled.span``;
const Description = styled.span``;

const Release = ({ version, versionPrevious, date, description }) => {
  const displayDate = moment(date).format('MMMM D, YYYY');
  const url = `https://github.com/netlify/netlify-cms/compare/${versionPrevious}...${version}`;

  return (
    <li
      css={css`
        flex: 1;
      `}
    >
      <ReleaseLink href={url}>
        <div
          css={css`
            margin-bottom: ${theme.space[1]};
          `}
        >
          <Version>{version}</Version>
          <span
            css={css`
              font-size: ${theme.fontsize[1]};
              color: rgba(255, 255, 255, 0.6);
            `}
          >
            {displayDate}
          </span>
        </div>
        <span
          css={css`
            font-size: ${theme.fontsize[2]};
          `}
        >
          <Markdownify source={description} />
        </span>
      </ReleaseLink>
    </li>
  );
};

const WhatsNew = ({ updates }) => (
  <section
    css={css`
      background: ${theme.colors.lightishGray};
      padding-top: ${theme.space[5]};
      padding-bottom: ${theme.space[5]};
    `}
  >
    <Container>
      <ol
        css={css`
          ${mq[2]} {
            display: flex;
            justify-content: space-between;
          }
        `}
      >
        {updates.map(item => (
          <Release {...item} key={item.version} />
        ))}
      </ol>
    </Container>
  </section>
);

export default WhatsNew;
