import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Markdownify from '../components/markdownify';

import '../css/imports/collab.css';

const CommunityPage = ({ data }) => {
  const { title, headline, subhead, sections } = data.markdownRemark.frontmatter;

  return (
    <Layout>
      <div className="community page">
        <Helmet title={title} />
        <section className="hero">
          <div className="contained">
            <div className="hero-copy">
              <h1 className="headline">
                <Markdownify source={headline} />
              </h1>
              <h2 className="subhead">
                <Markdownify source={subhead} />
              </h2>
            </div>
          </div>
        </section>

        <section className="community-channels clearfix">
          <div className="contained">
            <div className="half">
              {sections.map(({ title: sectionTitle, channels }, channelIdx) => (
                <React.Fragment key={channelIdx}>
                  <h4 className="section-label">{sectionTitle}</h4>
                  <ul className="community-channels-list">
                    {channels.map(({ title, description, url }, idx) => (
                      <li key={idx}>
                        <a href={url}>
                          <strong>{title}</strong>
                          <p>{description}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                </React.Fragment>
              ))}
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
