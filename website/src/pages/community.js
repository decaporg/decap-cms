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
import Markdown from '../components/markdown';
import SectionLabel from '../components/section-label';
import EventBox from '../components/event-box';
import Page from '../components/page';
import Grid from '../components/grid';

import theme from '../theme';
import { mq } from '../utils';

const CommunityPage = ({ data }) => {
  const { title, headline, subhead, sections } = data.markdownRemark.frontmatter;

  return (
    <Layout hasPageHero>
      <Helmet title={title} />
      <PageHero>
        <Grid cols={2}>
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
            <Lead>
              <Markdownify source={primarycta} />
            </Lead>
          </div>
          <div
            css={css`
              ${mq[2]} {
                position: fixed;
                right: 40px;
                top: 20%;
                max-height: calc(100vh - (104px * 1.5) - 40px);
                overflow-y: auto;
              }
            `}
          >
            <EventBox title={upcomingevent.hook} cta={primarycta} />
          </div>
        </Grid>
      </PageHero>

      <Container>
        <Page>
          <Grid cols={2}>
            <div>
              <div
                css={css`
                  margin-bottom: ${theme.space[5]};
                `}
              >
                <SectionLabel>How it works</SectionLabel>
                <Markdown source={howitworks} />
              </div>
              <SectionLabel>How to join</SectionLabel>
              <Markdown source={howtojoin} />
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
