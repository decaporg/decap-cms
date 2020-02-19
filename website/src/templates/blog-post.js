import React from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import { trimStart, trimEnd } from 'lodash';
import { css } from '@emotion/core';

import TwitterMeta from '../components/twitter-meta';
import Layout from '../components/layout';
import Container from '../components/container';
import Markdown from '../components/markdown';
import MetaInfo from '../components/meta-info';
import Page from '../components/page';

export const BlogPostTemplate = ({ title, author, date, body, html }) => (
  <Container size="sm">
    <Page as="article">
      <h1
        css={css`
          margin-bottom: 0;
        `}
      >
        {title}
      </h1>
      <MetaInfo>
        by {author} on {date}
      </MetaInfo>
      <Markdown body={body} html={html} />
    </Page>
  </Container>
);

const BlogPost = ({ data }) => {
  const { html, frontmatter } = data.markdownRemark;
  const {
    author,
    title,
    date,
    description,
    meta_description,
    twitter_image,
    canonical_url,
  } = frontmatter;
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
};

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
