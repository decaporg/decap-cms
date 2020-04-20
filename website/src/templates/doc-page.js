import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import 'prismjs/themes/prism-tomorrow.css';

import Layout from '../components/layout';
import DocsNav from '../components/docs-nav';
import Container from '../components/container';
import SidebarLayout from '../components/sidebar-layout';
import EditLink from '../components/edit-link';
import Widgets from '../components/widgets';
import Markdown from '../components/markdown';

function filenameFromPath(p) {
  return p
    .split('/')
    .slice(-1)[0]
    .split('.')[0];
}

const toMenu = (menu, nav) =>
  menu.map(group => ({
    title: group.title,
    group: nav.group.find(g => g.fieldValue === group.name),
  }));

const DocsSidebar = ({ docsNav, location }) => (
  <aside>
    <DocsNav items={docsNav} location={location} />
  </aside>
);

export const DocsTemplate = ({
  title,
  filename,
  body,
  html,
  showWidgets,
  widgets,
  showSidebar,
  docsNav,
  location,
  group,
}) => (
  <Container size="md">
    <SidebarLayout sidebar={showSidebar && <DocsSidebar docsNav={docsNav} location={location} />}>
      <article data-docs-content>
        {filename && <EditLink collection={`docs_${group}`} filename={filename} />}
        <h1>{title}</h1>
        <Markdown body={body} html={html} />
        {showWidgets && <Widgets widgets={widgets} location={location} />}
      </article>
    </SidebarLayout>
  </Container>
);

const DocPage = ({ data, location }) => {
  const {
    nav,
    page: { frontmatter, html, fields },
    widgets,
    menu,
  } = data;
  const { title, group } = frontmatter;

  const docsNav = toMenu(menu.siteMetadata.menu.docs, nav);
  const showWidgets = location.pathname.indexOf('/docs/widgets') !== -1;
  const filename = filenameFromPath(fields.path);

  return (
    <Layout>
      <Helmet title={title} />
      <DocsTemplate
        title={title}
        filename={filename}
        html={html}
        showWidgets={showWidgets}
        widgets={widgets}
        docsNav={docsNav}
        location={location}
        group={group}
        showSidebar
      />
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
        group
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
      filter: { frontmatter: { label: { ne: null } }, fields: { slug: { regex: "/widgets/" } } }
    ) {
      edges {
        node {
          frontmatter {
            title
            label
          }
          html
        }
      }
    }
  }
`;

export default DocPage;
