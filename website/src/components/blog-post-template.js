import React from 'react';
import { css } from '@emotion/core';

import Container from './container';
import Markdown from './markdown';
import MetaInfo from './meta-info';
import Page from './page';

export default function BlogPostTemplate({ title, author, date, body, html }) {
  return (
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
}
