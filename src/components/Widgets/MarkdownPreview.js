import React, { PropTypes } from 'react';
import { getSyntaxes } from './richText';
import MarkupItReactRenderer from '../MarkupItReactRenderer/index';

const MarkdownPreview = ({ value, getMedia }) => {
  if (value == null) {
    return null;
  }

  const schema = {
    'mediaproxy': ({ token }) => ( // eslint-disable-line
      <img
        src={getMedia(token.getIn(['data', 'src']))}
        alt={token.getIn(['data', 'alt'])}
      />
    ),
  };

  const { markdown } = getSyntaxes();
  return (
    <MarkupItReactRenderer
      value={value}
      syntax={markdown}
      schema={schema}
    />
  );
};

MarkdownPreview.propTypes = {
  getMedia: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
