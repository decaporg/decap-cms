import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

export const BlogPostTemplate = ({ title, author, date, body, html }) => (
  <div className="docs page">
    <div className="container">
      <article className="blog-content" id="blog-content">
        <div className="blog-post-header">
          <h1>{title}</h1>
          <p className="meta-info">
            by {author} on {date}
          </p>
        </div>
        {body ? body : <div dangerouslySetInnerHTML={{ __html: html }} />}
      </article>
    </div>
  </div>
);

const BlogPost = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark;
  const { author, title, date, description, meta_description } = frontmatter;

  const desc = meta_description || description;

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        {desc && <meta name="description" content={desc} />}
      </Helmet>
      <BlogPostTemplate title={title} author={author} date={date} html={html} />
    </Layout>
  );
};

export default BlogPost;

export const pageQuery = graphql`
  query blogPost($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      frontmatter {
        title
        description
        # meta_description
        date(formatString: "MMMM D, YYYY")
        author
      }
      html
    }
  }
`;
