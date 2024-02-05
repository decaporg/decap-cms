/** @jsx jsx */
import { jsx, css } from '@emotion/react';
import React from 'react';

import Markdownify from './markdownify';
import PageHero from './page-hero';
import HeroTitle from './hero-title';
import Lead from './lead';
import theme from '../theme';
import Container from './container';
import CommunityChannelsList from './community-channels-list';

function Community({ headline, subhead, sections }) {
  return (
    <Container size="md">
      <PageHero>
        <div
          css={css`
            margin-bottom: ${theme.space[7]};
          `}
        >
          <HeroTitle>
            <Markdownify source={headline} />
          </HeroTitle>
          <Lead light>
            <Markdownify source={subhead} />
          </Lead>
        </div>

        {sections.map(({ title: sectionTitle, channels }, channelIdx) => (
          <React.Fragment key={channelIdx}>
            <h2>
              <Markdownify source={sectionTitle} />
            </h2>
            <CommunityChannelsList channels={channels} />
          </React.Fragment>
        ))}
      </PageHero>
    </Container>
  );
}

export default Community;
