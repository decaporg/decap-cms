/** @jsx jsx */
import { jsx, css } from '@emotion/react'
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import { trimStart, trimEnd } from 'lodash';

import TwitterMeta from '../components/twitter-meta';
import Layout from '../components/layout';
import Container from '../components/container';
import Markdown from '../components/markdown';
import Page from '../components/page';

function BlogPost({ data }) {
  const { html, frontmatter } = data.markdownRemark;
  const { title, description, meta_description, image } = frontmatter;
  const { siteUrl } = data.site.siteMetadata;
  const imageUrl = image && `${trimEnd(siteUrl, '/')}/${trimStart(image, '/')}`;
  const desc = description || meta_description;

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        {desc && <meta name="description" content={desc} />}
        {image && <meta name="image" property="og:image" content={imageUrl} />}
      </Helmet>
      <TwitterMeta title={title} description={desc} image={imageUrl} />
      <Container size="sm">
        <Page as="article">
          <h1
            css={css`
              margin-bottom: 0;
            `}
          >
            {title}
          </h1>
          <Markdown html={html} />
        </Page>
      </Container>
    </Layout>
  );
}

export default BlogPost;

export const pageQuery = graphql`
  query servicesPage {
    site {
      siteMetadata {
        siteUrl
      }
    }
    markdownRemark(fileAbsolutePath: { regex: "/services/" }) {
      frontmatter {
        title
        description
        # meta_description
        image
      }
      html
    }
  }
`;
