import React from 'react';
import { graphql } from 'gatsby';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import Markdownify from '../components/markdownify';
import PageHero from '../components/page-hero';
import HeroTitle from '../components/hero-title';
import VideoEmbed from '../components/video-embed';
import WhatsNew from '../components/whats-new';
import Lead from '../components/lead';
import Features from '../components/features';
import HomeSection from '../components/home-section';
import Grid from '../components/grid';

import theme from '../theme';
import { mq } from '../utils';

const MarkdownButton = styled.span`
  a {
    white-space: nowrap;
    display: inline-block;
    color: white;
    text-transform: uppercase;
    font-weight: 700;
    font-size: ${theme.fontsize[3]};
    letter-spacing: 0.5px;
    line-height: ${theme.lineHeight[1]};
    background-color: ${theme.colors.blue};
    background-image: linear-gradient(-180deg, #4a7fdd 0%, #3a69c7 100%);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 0 rgba(0, 0, 0, 0.6);
    border-radius: ${theme.radii[1]};
    padding: ${theme.space[2]} ${theme.space[3]};
    transition: 0.2s;
    text-decoration: none;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.5), 0 1px 3px 0 rgba(0, 0, 0, 1);
    }
    &:active {
      transform: scale(0.95);
      box-shadow: none;
    }
  }
`;

const ContribList = styled.div`
  display: flex;
  flex-wrap: wrap;

  img {
    height: 32px;
    width: 32px;
    border-radius: 10rem;
    margin-right: ${theme.space[1]};
    margin-bottom: ${theme.space[1]};
    transition: 0.1s;

    &:hover {
      transform: scale(1.3);
      box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.25), 0 4px 12px 0 rgba(0, 0, 0, 0.25);
    }
  }
`;

const HomePage = ({ data }) => {
  const landing = data.landing.childDataYaml;
  const updates = data.updates.childDataYaml;
  const contribs = data.contribs.childDataJson;

  return (
    <Layout hasPageHero>
      <PageHero>
        <div
          css={css`
            margin-bottom: ${theme.space[7]};
          `}
        >
          <HeroTitle>
            <Markdownify source={landing.hero.headline} />
          </HeroTitle>
          <Lead>
            <Markdownify source={landing.hero.subhead} />
          </Lead>
          <Lead>
            <MarkdownButton>
              <Markdownify source={landing.cta.button} />
            </MarkdownButton>
          </Lead>
        </div>
        <Grid cols={2}>
          <div>
            <Features items={landing.hero.devfeatures} kind="light" />
          </div>
          <div>
            <VideoEmbed />
          </div>
        </Grid>
      </PageHero>

      <section
        css={css`
          background: white;
          ${mq[2]} {
            position: absolute;
            left: 50%;
            transform: translate(-50%, -75%);
            width: 880px;
            border-radius: 8px;
          }
        `}
      >
        <div
          css={css`
            padding: ${theme.space[4]} ${theme.space[5]};
            color: ${theme.colors.lightishGray};
            ${mq[2]} {
              display: flex;
            }
          `}
        >
          <Lead
            css={css`
              margin-right: 2rem;
              font-size: 18px;
              ${mq[2]} {
                margin-bottom: 0;
              }
            `}
          >
            <strong>
              <Markdownify source={landing.cta.primaryhook} />
            </strong>{' '}
            <Markdownify source={landing.cta.primary} />
          </Lead>
          <MarkdownButton>
            <Markdownify source={landing.cta.button} />
          </MarkdownButton>
        </div>
      </section>

      <WhatsNew updates={updates.updates} />

      <HomeSection
        title={<Markdownify source={landing.editors.hook} />}
        text={<Markdownify source={landing.editors.intro} />}
      >
        <Grid cols={3}>
          <Features items={landing.editors.features} />
        </Grid>
      </HomeSection>

      <HomeSection
        css={css`
          background: white;
        `}
        title={<Markdownify source={landing.community.hook} />}
      >
        <Grid cols={2}>
          <div>
            <Features items={landing.community.features} />
          </div>
          <div>
            <h3
              css={css`
                font-size: 18px;
              `}
            >
              {landing.community.contributors}
            </h3>
            <ContribList>
              {contribs.contributors.map(user => (
                <a href={user.profile} title={user.name} key={user.login}>
                  <img src={user.avatar_url.replace('v=4', 's=32')} alt={user.login} />
                </a>
              ))}
            </ContribList>
          </div>
        </Grid>
      </HomeSection>
    </Layout>
  );
};

export const pageQuery = graphql`
  query homeQuery {
    updates: file(relativePath: { regex: "/updates/" }) {
      childDataYaml {
        updates {
          date
          description
          version
          url
        }
      }
    }
    landing: file(relativePath: { regex: "/landing/" }) {
      childDataYaml {
        hero {
          headline
          subhead
          devfeatures {
            feature
            description
          }
        }
        cta {
          primary
          primaryhook
          button
        }
        editors {
          hook
          intro
          features {
            feature
            imgpath
            description
          }
        }
        community {
          hook
          features {
            feature
            description
          }
          contributors
        }
      }
    }
    contribs: file(relativePath: { regex: "/contributors/" }) {
      childDataJson {
        contributors {
          name
          profile
          avatar_url
          login
        }
      }
    }
  }
`;

export default HomePage;
