import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';
import ImmutablePropTypes from 'react-immutable-proptypes';
import DOMPurify from 'dompurify';

import { markdownToHtml } from './serializers';

function RichtextPreview({ value, getAsset, resolveWidget, field, getRemarkPlugins }) {
  if (value === null) {
    return null;
  }

  const html = markdownToHtml(value, { getAsset, resolveWidget }, getRemarkPlugins?.());
  const toRender = field?.get('sanitize_preview', false) ? DOMPurify.sanitize(html) : html;

  return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: toRender }} />;
}

RichtextPreview.propTypes = {
  value: PropTypes.string,
  getAsset: PropTypes.func.isRequired,
  resolveWidget: PropTypes.func.isRequired,
  field: ImmutablePropTypes.map.isRequired,
  getRemarkPlugins: PropTypes.func,
};

export default RichtextPreview;
