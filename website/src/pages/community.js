import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import Markdownify from '../components/markdownify';
import PageHero from '../components/page-hero';
import HeroTitle from '../components/hero-title';
import Lead from '../components/lead';
import Container from '../components/container';
import SectionLabel from '../components/section-label';
import Page from '../components/page';
import Grid from '../components/grid';
import CommunityChannelsList from '../components/community-channels-list';

import theme from '../theme';

const CommunityPage = ({ data }) => {
  const { title, headline, subhead, sections } = data.markdownRemark.frontmatter;

  return (
    <Layout hasPageHero>
      <Helmet title={title} />
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
    </Layout>
  );
};

export const pageQuery = graphql`
  query communityPage {
    markdownRemark(fileAbsolutePath: { regex: "/community/" }) {
      frontmatter {
        headline
        subhead
        sections {
          title
          channels {
            title
            description
            url
          }
        }
      }
    }
  }
`;

export default CommunityPage;
