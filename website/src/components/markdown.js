import React from 'react';
import styled from '@emotion/styled';

import theme from '../theme';

const StyledMarkdown = styled.div`
  > :first-child {
    margin-top: 0;
  }
  > :last-child {
    margin-bottom: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: ${theme.lineHeight[1]};
    margin-top: 2em;
    margin-bottom: 0.25em;
  }

  h1 {
    font-size: ${theme.fontsize[6]};
  }

  h2 {
    font-size: ${theme.fontsize[5]};
  }

  h3 {
    font-size: ${theme.fontsize[4]};
  }

  h4 {
    font-size: ${theme.fontsize[3]};
  }

  ol,
  ul {
    margin-left: ${theme.space[3]};
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  li {
    margin-bottom: 0;
  }

  ol,
  ul,
  p {
    font-size: 18px;
    margin-bottom: 1rem;
  }

  a {
    font-weight: bold;

    &:hover {
      text-decoration: underline;
    }
  }

  table {
    border: 0;
    background: #f7f7f7;
    border-radius: 4px;
    margin-top: 40px;
    margin-bottom: 40px;
    width: 100%;
    text-align: left;
  }

  tbody tr {
    &:nth-child(odd) {
      background: #fdfdfd;
    }
  }

  th,
  td {
    padding: 8px;
  }

  th {
    font-weight: 700;
    font-size: 18px;
  }

  td {
    font-size: 14px;
  }

  iframe {
    width: 100%;
  }

  pre {
    border-radius: ${theme.radii[2]};
    margin-bottom: ${theme.space[4]};
    margin-top: ${theme.space[4]};
  }

  pre > code {
    font-size: ${theme.fontsize[2]};
    line-height: ${theme.lineHeight[0]};
  }

  *:not(pre) > code {
    color: inherit;
    background: #e6e6e6;
    border-radius: 2px;
    padding: 2px 6px;
    white-space: nowrap;
    font-size: ${theme.fontsize[2]};
  }
`;

const Markdown = ({ html }) => {
  return <StyledMarkdown dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
