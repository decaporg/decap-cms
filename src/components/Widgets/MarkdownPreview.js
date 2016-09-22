import React, { PropTypes } from 'react';
import { getSyntaxes } from './richText';
import MarkitupReactRenderer from './MarkitupReactRenderer';

const MarkdownPreview = ({ value }) => {
  if (value == null) {
    return null;
  }

  const { markdown } = getSyntaxes();
  return (
    <MarkitupReactRenderer
        value={value}
        syntax={markdown}
    />
  );
};

MarkdownPreview.propTypes = {
  value: PropTypes.string,
};

export default MarkdownPreview;
