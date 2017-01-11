import React, { PropTypes } from 'react';
import { getSyntaxes } from './richText';
import MarkupItReactRenderer from '../MarkupItReactRenderer/index';
import previewStyle from './defaultPreviewStyle';

const MarkdownPreview = ({ value, getAsset }) => {
  if (value == null) {
    return null;
  }

  const schema = {
    'mediaproxy': ({ token }) => ( // eslint-disable-line
      <img
        src={getAsset(token.getIn(['data', 'src']))}
        alt={token.getIn(['data', 'alt'])}
      />
    ),
  };

  const { markdown } = getSyntaxes();
  return (
    <div style={previewStyle}>
      <MarkupItReactRenderer
        value={value}
        syntax={markdown}
        schema={schema}
        getAsset={getAsset}
      />
    </div>
  );
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
