import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import Community from '../components/community';

import '../css/imports/collab.css';

const CommunityPage = ({ data }) => {
  const { title, headline, subhead, sections } = data.markdownRemark.frontmatter;

  return (
    <Layout>
      <Helmet title={title} />
      <Community headline={headline} subhead={subhead} sections={sections} />
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
