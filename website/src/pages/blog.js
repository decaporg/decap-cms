import React from 'react';
import Helmet from 'react-helmet';
import { Link, graphql } from 'gatsby';

import Layout from '../components/layout';

const Blog = ({ data }) => (
  <Layout>
    <div className="blog page">
      <Helmet>
        <title>Blog</title>
        <meta name="description" content="Recent news and updates about Netlify CMS." />
      </Helmet>
      <div className="container">
        <h1>Netlify CMS Blog</h1>
        {data.allMarkdownRemark.edges.map(({ node }) => (
          <article className="blog-list-item" key={node.id}>
            <h2>
              <Link to={node.fields.slug} className="article">
                {node.frontmatter.title}
              </Link>
            </h2>
            <p className="meta-info">
              by {node.frontmatter.author} on {node.frontmatter.date}
            </p>
            <p>{node.frontmatter.description}</p>
          </article>
        ))}
        {/* TODO: pagination */}
      </div>
    </div>
  </Layout>
);

export default Blog;

export const pageQuery = graphql`
  query blogList {
    allMarkdownRemark(
      filter: { fields: { slug: { regex: "/blog/" } } }
      sort: { order: DESC, fields: [fields___date] }
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
