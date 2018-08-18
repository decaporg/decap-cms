import React from 'react';
import Helmet from 'react-helmet';
import Markdown from 'react-markdown';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import EventWidget from '../components/event-widget';
import Markdownify from '../components/markdownify';

import '../css/imports/collab.css';

const CommunityPage = ({ data }) => {
  const {
    title,
    headline,
    subhead,
    primarycta,
    upcomingevent,
    howitworks,
    howtojoin,
  } = data.markdownRemark.frontmatter;

  return (
    <Layout>
      <div className="community page">
        <Helmet title={title} />
        <section className="community hero">
          <div className="contained">
            <div className="hero-copy">
              <h1 className="headline">
                <Markdownify source={headline} />
              </h1>
              <h2 className="subhead">
                <Markdownify source={subhead} />
              </h2>
              <h3 className="ctas">
                <ul>
                  <li>
                    <Markdownify source={primarycta} />
                  </li>
                </ul>
              </h3>
            </div>

            <div className="calendar-cta">
              <h2>{upcomingevent.hook}</h2>
              <EventWidget />
              <div className="cal-cta">
                <Markdownify source={primarycta} />
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works clearfix">
          <div className="contained">
            <div className="half">
              <h4 className="section-label">How it works</h4>
              <p>
                <Markdown source={howitworks} />
              </p>
              <h4 className="section-label">How to join</h4>
              <p>
                <Markdown source={howtojoin} />
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query communityPage {
    markdownRemark(fileAbsolutePath: { regex: "/community/" }) {
      frontmatter {
        headline
        subhead
        primarycta
        upcomingevent {
          hook
        }
        howitworks
        howtojoin
      }
    }
  }
`;

export default CommunityPage;
