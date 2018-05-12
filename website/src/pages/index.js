import React, { Component, Fragment } from 'react';
import moment from 'moment';

import Markdownify from '../components/markdownify';

import screenshorEditor from '../img/screenshot-editor.jpg';

class VideoEmbed extends Component {
  state = {
    toggled: false
  };
  toggleVideo = event => {
    this.setState({
      toggled: true
    });
  };
  render() {
    const { toggled } = this.state;

    const embedcode = (
      <iframe
        width={560}
        height={315}
        src="https://www.youtube-nocookie.com/embed/p6h-rYSVX90?rel=0&showinfo=0&autoplay=1"
        frameBorder={0}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    );

    const imgPlaceholder = (
      <img src={screenshorEditor} className="responsive" />
    );

    return (
      <a className="hero-graphic" onClick={this.toggleVideo}>
        {toggled ? embedcode : imgPlaceholder}
        {!toggled && <div className="hero-videolink">&#x25b6;</div>}
      </a>
    );
  }
}

const Features = ({ items }) => (
  <Fragment>
    {items.map(item => (
      <div className="feature" key={item.feature}>
        {item.imgpath && <img src={require(`../img/${item.imgpath}`)} />}
        <h3>
          <Markdownify source={item.feature} />
        </h3>
        <p>
          <Markdownify source={item.description} />
        </p>
      </div>
    ))}
  </Fragment>
);

const HomePage = ({ data }) => {
  const { landing, updates, contribs } = data;

  return (
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

      <section className="whatsnew">
        <div className="contained">
          <ol>
            {updates.edges.map(({ node }) => (
              <a
                href={`https://github.com/netlify/netlify-cms/releases/tag/${
                  node.version
                }`}
                key={node.version}
              >
                <li>
                  <div className="update-metadata">
                    <span className="update-version">{node.version}</span>
                    <span className="update-date">
                      {moment(node.date).format('MMMM D, YYYY')}
                    </span>
                  </div>
                  <span className="update-description">
                    <Markdownify source={node.description} />
                  </span>
                </li>
              </a>
            ))}
          </ol>
        </div>
      </section>

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
                  <img
                    src={user.avatar_url.replace('v=4', 's=32')}
                    alt={user.login}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const pageQuery = graphql`
  query homeQuery {
    updates: allUpdatesYaml(limit: 3) {
      edges {
        node {
          date
          description
          version
        }
      }
    }
    landing: dataYaml(id: { regex: "/landing/" }) {
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
    contribs: dataJson(id: { regex: "/contributors/" }) {
      contributors {
        name
        profile
        avatar_url
        login
      }
    }
  }
`;

export default HomePage;
