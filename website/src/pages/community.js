import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import Markdownify from '../components/markdownify';
import PageHero from '../components/page-hero';
import HeroTitle from '../components/hero-title';
import Lead from '../components/lead';
import Container from '../components/container';
import Markdown from '../components/Markdown';
import SectionLabel from '../components/section-label';
import EventBox from '../components/event-box';

import theme from '../theme';
import { mq } from '../utils';

const CommunityPage = ({ data }) => {
  const { title, headline, subhead, sections } = data.markdownRemark.frontmatter;

  return (
    <Layout>
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
          <Lead>
            <Markdownify source={subhead} />
          </Lead>
          <Lead>
            <Markdownify source={primarycta} />
          </Lead>
        </div>
        <div>
          <EventBox title={upcomingevent.hook} cta={primarycta} />
        </div>
      </PageHero>

      <section className="how-it-works clearfix">
        <Container>
          <div css={{ width: '50%' }}>
            <SectionLabel>How it works</SectionLabel>
            <Markdown source={howitworks} />
            <SectionLabel>How to join</SectionLabel>
            <Markdown source={howtojoin} />
          </div>
        </Container>
      </section>
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
