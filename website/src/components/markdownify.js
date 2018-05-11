import React from 'react';
import Markdown from 'react-markdown';

const Markdownify = ({ source }) => (
  <Markdown source={source} renderers={{ root: 'span', paragraph: 'span' }} />
);

export default Markdownify;
