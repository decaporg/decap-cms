import React, { Fragment } from 'react';
import Markdown from 'react-markdown';

function Markdownify({ source }) {
  return <Markdown components={{ '**': Fragment, p: Fragment }}>{source}</Markdown>;
}

export default Markdownify;
