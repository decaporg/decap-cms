import React from 'react';
import Helmet from 'react-helmet';
import { matchPath } from 'react-router-dom';

import EditLink from '../components/edit-link';
import Widgets from '../components/widgets';
import DocsNav from '../components/docs-nav';
import MobileNav from '../components/mobile-nav';

import '../css/lib/prism.css';
import '../css/imports/docs.css';

const toMenu = (menu, nav) =>
  menu.map(group => ({
    title: group.title,
    group: nav.group.find(g => g.fieldValue === group.name)
  }));

const DocPage = ({ data, location, history }) => {
  const { nav, page, widgets, menu } = data;

  const docsNav = toMenu(menu.siteMetadata.menu.docs, nav);
  const showWidgets = matchPath(location.pathname, { path: '/docs/widgets' });

  return (
    <div className="docs detail page">
      <Helmet title={page.frontmatter.title} />
      <div className="container">
        <aside id="sidebar" className="sidebar">
          <DocsNav items={docsNav} location={location} />
          <MobileNav items={docsNav} history={history} />
        </aside>
        <article className="docs-content" id="docs-content">
          <EditLink path={page.fields.path} />
          <h1>{page.frontmatter.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.html }} />
          {showWidgets && <Widgets widgets={widgets} />}
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
      sort: { fields: [frontmatter___weight], order: ASC }
      filter: {
        frontmatter: { title: { ne: null }, group: { ne: null } }
        fields: { slug: { regex: "/docs/" } }
      }
    ) {
      group(field: frontmatter___group) {
        fieldValue
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              group
            }
            tableOfContents
          }
        }
      }
    }
    menu: site {
      siteMetadata {
        menu {
          docs {
            name
            title
          }
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
            target
          }
          html
        }
      }
    }
  }
`;

export default DocPage;
