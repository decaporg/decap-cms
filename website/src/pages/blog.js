import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, graphql } from 'gatsby';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import Container from '../components/container';
import MetaInfo from '../components/meta-info';
import Page from '../components/page';
import Lead from '../components/lead';
import theme from '../theme';

function Blog({ data }) {
  return (
    <Layout>
      <Helmet>
        <title>Blog</title>
        <meta name="description" content="Recent news and updates about Netlify CMS." />
      </Helmet>
      <Page>
        <Container size="sm">
          <h1>Netlify CMS Blog</h1>
          {data.allMarkdownRemark.edges.map(({ node }) => (
            <article
              key={node.id}
              css={css`
                margin-bottom: ${theme.space[5]};
              `}
            >
              <h2
                css={css`
                  margin-bottom: 0;
                `}
              >
                <Link to={node.fields.slug}>{node.frontmatter.title}</Link>
              </h2>
              <MetaInfo>
                by {node.frontmatter.author} on {node.frontmatter.date}
              </MetaInfo>
              <Lead>{node.frontmatter.description}</Lead>
            </article>
          ))}
          {/* TODO: pagination */}
        </Container>
      </Page>
    </Layout>
  );
}

export default Blog;

export const pageQuery = graphql`
  query blogList {
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "/blog/" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          id
          frontmatter {
            title
            description
            author
            date(formatString: "MMMM D, YYYY")
          }
          fields {
            slug
          }
        }
      }
    }
  }
`;
