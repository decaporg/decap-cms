import ReactMarkdown from 'react-markdown';
import styled from '@emotion/styled';

import { mq } from '../utils';

const Markdown = styled(ReactMarkdown)`
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
    line-height: 1.2;
    margin-top: 2em;
    margin-bottom: 0.5em;
  }

  h1 {
    font-size: 32px;
  }

  h2 {
    font-size: 24px;
  }

  h3 {
    font-size: 20px;
  }

  h4 {
    font-size: 18px;
  }

  ol,
  ul {
    margin-left: 2rem;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  li {
    margin-bottom: 0.5rem;
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
    border-collapse: collapse;
    background: #f7f7f7;
    border-radius: 4px;
    margin-top: 40px;
    margin-bottom: 40px;
    width: 100%;
    text-align: left;
  }

  tr {
    background: white;
    &:nth-child(odd) {
      background: #fdfdfd;
    }
  }

  th,
  td {
    padding: 8px;
    border: 1px solid lightgray;
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
    margin: 30px -16px !important;
    ${mq[4]} {
      margin-right: -120px !important;
    }
  }

  *:not(pre) > code {
    color: inherit;
    background: #e6e6e6;
    border-radius: 2px;
    padding: 2px 6px;
    white-space: nowrap;
  }
`;

export default Markdown;
