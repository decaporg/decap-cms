import React, { Fragment } from 'react';
import Markdown from 'react-markdown';

const Markdownify = ({ source }) => (
  <Markdown source={source} renderers={{ root: Fragment, paragraph: Fragment }} />
);

export default Markdownify;
