import React, { Fragment } from 'react';
import Markdown from 'react-markdown';

const Markdownify = ({ source }) => (
  <Markdown renderers={{ root: Fragment, paragraph: Fragment }}>{source}</Markdown>
);

export default Markdownify;
