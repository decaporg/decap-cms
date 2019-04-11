import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Markdownify from '../components/markdownify';
import VideoEmbed from '../components/video-embed';
import WhatsNew from '../components/whats-new';
import Release from '../components/release';

import '../css/imports/hero.css';
import '../css/imports/cta.css';
import '../css/imports/whatsnew.css';
import '../css/imports/editors.css';
import '../css/imports/community.css';

const Features = ({ items }) =>
  items.map(item => (
    <div className="feature" key={item.feature}>
      {item.imgpath && <img src={require(`../img/${item.imgpath}`)} />}
      <h3>
        <Markdownify source={item.feature} />
      </h3>
      <p>
        <Markdownify source={item.description} />
      </p>
    </div>
  ));

const HomePage = ({ data }) => {
  const landing = data.landing.childDataYaml;
  const updates = data.updates.childDataYaml;
  const contribs = data.contribs.childDataJson;

  return (
    <Layout>
      <div className="landing page">
        <section className="landing hero">
          <div className="contained">
            <div className="hero-copy">
              <h1 className="headline">
                <Markdownify source={landing.hero.headline} />
              </h1>
              <span className="subhead">
                <Markdownify source={landing.hero.subhead} />
              </span>
              <span className="cta-header">
                <Markdownify source={landing.cta.button} />
              </span>
            </div>
            <div className="hero-features">
              <Features items={landing.hero.devfeatures} />
            </div>
            <VideoEmbed />
          </div>
        </section>

        <section className="cta">
          <div className="cta-primary">
            <p>
              <span className="hook">
                <Markdownify source={landing.cta.primaryhook} />
              </span>{' '}
              <Markdownify source={landing.cta.primary} />
            </p>
            <Markdownify source={landing.cta.button} />
          </div>
        </section>

        <WhatsNew>
          {updates.updates.slice(0, 3).map((node, idx) => (
            <Release
              key={idx}
              version={node.version}
              versionPrevious={updates.updates[idx + 1].version}
              date={node.date}
              description={node.description}
              url={node.url}
            />
          ))}
        </WhatsNew>

        <section className="editors">
          <div className="contained">
            <h2>
              <Markdownify source={landing.editors.hook} />
            </h2>
            <p id="editor-intro">
              <Markdownify source={landing.editors.intro} />
            </p>
            <div className="editors-features">
              <Features items={landing.editors.features} />
            </div>
          </div>
        </section>

        <section className="communitysupport">
          <div className="contained">
            <h2>
              <Markdownify source={landing.community.hook} />
            </h2>
            <div className="community">
              <div className="community-features">
                <Features items={landing.community.features} />
              </div>
            </div>
            <div className="contributors feature">
              <h3>{landing.community.contributors}</h3>
              <div className="contributor-list">
                {contribs.contributors.map(user => (
                  <a href={user.profile} title={user.name} key={user.login}>
                    <img src={user.avatar_url.replace('v=4', 's=32')} alt={user.login} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
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
