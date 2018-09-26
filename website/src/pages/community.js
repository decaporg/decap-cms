import React from 'react';
import Helmet from 'react-helmet';
import Markdown from 'react-markdown';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import EventWidget from '../components/event-widget';
import Markdownify from '../components/markdownify';

import '../css/imports/collab.css';

export const CommunityTemplate = ({
  headline,
  subhead,
  cta,
  eventIntro,
  howItWorks,
  howToJoin,
}) => (
  <div className="community page">
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
                <Markdownify source={cta} />
              </li>
            </ul>
          </h3>
        </div>

        <div className="calendar-cta">
          <h2>{eventIntro}</h2>
          <EventWidget />
          <div className="cal-cta">
            <Markdownify source={cta} />
          </div>
        </div>
      </div>
    </section>

    <section className="how-it-works clearfix">
      <div className="contained">
        <div className="half">
          <h4 className="section-label">How it works</h4>
          <p>
            <Markdown source={howItWorks} />
          </p>
          <h4 className="section-label">How to join</h4>
          <p>
            <Markdown source={howToJoin} />
          </p>
        </div>
      </div>
    </section>
  </div>
);

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
      <Helmet title={title} />
      <CommunityTemplate
        title={title}
        headline={headline}
        subhead={subhead}
        cta={primarycta}
        eventIntro={upcomingevent.hook}
        howItWorks={howitworks}
        howToJoin={howtojoin}
      />
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
