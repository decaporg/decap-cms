import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';
import ImmutablePropTypes from 'react-immutable-proptypes';
import DOMPurify from 'dompurify';

import { markdownToHtml } from './serializers';

function RichtextPreview({
  value,
  getAsset,
  resolveWidget,
  field,
  getRemarkPlugins,
  getEditorComponents,
}) {
  if (value === null) {
    return null;
  }
  const html = markdownToHtml(
    value,
    { getAsset, resolveWidget, editorComponents: getEditorComponents?.() },
    getRemarkPlugins?.(),
  );
  const toRender = field?.get('sanitize_preview', false) ? DOMPurify.sanitize(html) : html;

  // Inject block-specific styles into the iframe
  const previewStyles = `
    blockquote {
      padding-left: 16px;
      border-left: 3px solid #eff0f4;
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 16px;
    }
  `;
  

    return (
    <WidgetPreviewContainer>
      <style>{previewStyles}</style>
      <div dangerouslySetInnerHTML={{ __html: toRender }} />
    </WidgetPreviewContainer>
  );
}

RichtextPreview.propTypes = {
  value: PropTypes.string,
  getAsset: PropTypes.func.isRequired,
  resolveWidget: PropTypes.func.isRequired,
  field: ImmutablePropTypes.map.isRequired,
  getRemarkPlugins: PropTypes.func,
  getEditorComponents: PropTypes.func,
};

export default RichtextPreview;
