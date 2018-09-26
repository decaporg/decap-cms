import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

const Roadmap = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark;
  const { title, description, heading, intro } = frontmatter;

  return (
    <Layout>
      <div className="roadmap page">
        <Helmet>
          <title>{title}</title>
          <meta name="description" content={description} />
        </Helmet>
        <div className="container">
          <h1>{heading}</h1>
          <p>{intro}</p>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query roadmapPage {
    markdownRemark(fileAbsolutePath: { regex: "/roadmap/" }) {
      frontmatter {
        title
        description
        heading
        intro
      }
      html
    }
  }
`;

export default Roadmap;
