import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import EditLink from '../components/edit-link';
import Widgets from '../components/widgets';
import DocsNav from '../components/docs-nav';

import '../css/imports/docs.css';

const DocPage = ({ data, location }) => {
  const { page } = data;

  const showWidgets = location.pathname.indexOf('/docs/widgets') !== -1;

  return (
    <Layout>
      <div className="page page-docs">
        <Helmet title={page.frontmatter.title} />
        <div className="container">
          <aside id="sidebar" className="page-sidebar">
            <DocsNav location={location} />
          </aside>
          <article className="page-content docs-content" id="docs-content">
            <EditLink path={page.fields.path} />
            <h1>{page.frontmatter.title}</h1>
            <div className="typography" dangerouslySetInnerHTML={{ __html: page.html }} />
            {showWidgets && <Widgets />}
          </article>
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query docPage($slug: String!) {
    page: markdownRemark(fields: { slug: { eq: $slug } }) {
      fields {
        path
      }
      frontmatter {
        title
      }
      html
    }
  }
`;

export default DocPage;
