import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import { trimStart, trimEnd } from 'lodash';

import TwitterMeta from '../components/twitter-meta';
import Layout from '../components/layout';
import BlogPostTemplate from '../components/blog-post-template';

function BlogPost({ data }) {
  const { html, frontmatter } = data.markdownRemark;
  const { author, title, date, description, meta_description, image, canonical_url } = frontmatter;
  const { siteUrl } = data.site.siteMetadata;
  const imageUrl = image && `${trimEnd(siteUrl, '/')}/${trimStart(image, '/')}`;
  const desc = description || meta_description;

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        {desc && <meta name="description" content={desc} />}
        {image && <meta name="image" property="og:image" content={imageUrl} />}
        {author && <meta name="author" content={author} />}
        {canonical_url && <link rel="canonical" href={canonical_url} />}
      </Helmet>
      <TwitterMeta title={title} description={desc} image={imageUrl} />
      <BlogPostTemplate title={title} author={author} date={date} html={html} />
    </Layout>
  );
}

export default BlogPost;

export const pageQuery = graphql`
  query blogPost($slug: String!) {
    site {
      siteMetadata {
        siteUrl
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      frontmatter {
        title
        description
        # meta_description
        date(formatString: "MMMM D, YYYY")
        author
        image
        canonical_url
      }
      html
    }
  }
`;
