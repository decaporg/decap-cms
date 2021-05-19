import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import { trimStart, trimEnd } from 'lodash';

import TwitterMeta from '../components/twitter-meta';
import Layout from '../components/layout';
import BlogPostTemplate from '../components/blog-post-template';

function BlogPost({ data }) {
  const { html, frontmatter } = data.markdownRemark;
  const { author, title, date, description, meta_description, twitter_image, canonical_url } =
    frontmatter;
  const { siteUrl } = data.site.siteMetadata;
  const twitterImageUrl =
    twitter_image && `${trimEnd(siteUrl, '/')}/${trimStart(twitter_image, '/')}`;

  const desc = meta_description || description;

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        {desc && <meta name="description" content={desc} />}
        {canonical_url && <link rel="canonical" href={canonical_url} />}
      </Helmet>
      <TwitterMeta title={title} description={desc} image={twitterImageUrl} />
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
        twitter_image
        canonical_url
      }
      html
    }
  }
`;
