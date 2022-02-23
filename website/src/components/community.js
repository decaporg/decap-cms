import React from 'react';
import { css } from '@emotion/core';

import Markdownify from './markdownify';
import PageHero from './page-hero';
import HeroTitle from './hero-title';
import Lead from './lead';
import Container from './container';
import SectionLabel from './section-label';
import Page from './page';
import Grid from './grid';
import CommunityChannelsList from './community-channels-list';
import theme from '../theme';

function Community({ headline, subhead, sections }) {
  return (
    <>
      <PageHero>
        <div
          css={css`
            margin-bottom: 20px;
          `}
        >
          <HeroTitle>
            <Markdownify source={headline} />
          </HeroTitle>
          <Lead light>
            <Markdownify source={subhead} />
          </Lead>
        </div>
      </PageHero>

      <Container>
        <Page>
          <Grid cols={2}>
            <div
              css={css`
                margin-bottom: ${theme.space[5]};
              `}
            >
              {sections.map(({ title: sectionTitle, channels }, channelIdx) => (
                <React.Fragment key={channelIdx}>
                  <SectionLabel>{sectionTitle}</SectionLabel>
                  <CommunityChannelsList channels={channels} />
                </React.Fragment>
              ))}
            </div>
          </Grid>
        </Page>
      </Container>
    </>
  );
}

export default Community;
