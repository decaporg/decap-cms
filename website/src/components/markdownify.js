import React, { Fragment } from 'react';
import Markdown from 'react-markdown';

function Markdownify({ source }) {
  return <Markdown renderers={{ root: Fragment, paragraph: Fragment }}>{source}</Markdown>;
}

export default Markdownify;
