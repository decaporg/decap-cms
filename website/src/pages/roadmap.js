import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

export const RoadmapTemplate = ({ heading, intro, body, html }) => (
  <div className="roadmap page">
    <div className="container">
      <h1>{heading}</h1>
      <p>{intro}</p>
      {body ? body : <div dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  </div>
);

const Roadmap = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark;
  const { title, description, heading, intro } = frontmatter;

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      <RoadmapTemplate heading={heading} intro={intro} html={html} />
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
