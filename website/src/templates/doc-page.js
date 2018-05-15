import React, { Component, Fragment } from 'react';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';

import EditLink from '../components/edit-link';
import Widgets from '../components/widgets';
import MobileNav from '../components/mobile-nav';

import '../css/lib/prism.css';

const TableOfContents = ({ node }) => {
  // unescape less-than character done in gatsby-transformer-remark
  const toc = node.tableOfContents.replace(/&#x3C;/g, '<');

  return (
    <div
      className="nav-subsections"
      dangerouslySetInnerHTML={{ __html: toc }}
    />
  );
};

const DocPage = ({ data, location, history }) => {
  const { nav, page, widgets } = data;

  return (
    <div className="docs detail page">
      <Helmet title={page.frontmatter.title} />
      <div className="container">
        <aside id="sidebar" className="sidebar">
          <nav className="docs-nav" id="docs-nav">
            {nav.edges.map(({ node }) => {
              return (
                <Fragment key={node.fields.slug}>
                  <Link
                    to={node.fields.slug}
                    className="nav-link"
                    activeClassName="active"
                  >
                    {node.frontmatter.title}
                  </Link>
                  {location.pathname === node.fields.slug && (
                    <TableOfContents node={node} />
                  )}
                </Fragment>
              );
            })}
          </nav>
          <MobileNav items={nav.edges} history={history} />
        </aside>
        <article className="docs-content" id="docs-content">
          <EditLink path={page.fields.path} />
          <h1>{page.frontmatter.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.html }} />

          {location.pathname === '/docs/widgets/' && (
            <Widgets widgets={widgets} />
          )}
        </article>
      </div>
    </div>
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
    nav: allMarkdownRemark(
      sort: { fields: [frontmatter___position], order: ASC }
      filter: {
        fields: { slug: { regex: "/docs/" } }
        frontmatter: { title: { ne: "" } }
      }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
          tableOfContents
        }
      }
    }
    widgets: allMarkdownRemark(
      sort: { fields: [frontmatter___label], order: ASC }
      filter: {
        frontmatter: { label: { ne: null } }
        fields: { slug: { regex: "/widgets/" } }
      }
    ) {
      edges {
        node {
          frontmatter {
            label
          }
          html
        }
      }
    }
  }
`;

export default DocPage;
