import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import { markdownToHtml } from './serializers';

let editorPreview;

export const getEditorPreview = () => editorPreview;

const MarkdownPreview = props => {
  const { value, getAsset, resolveWidget } = props;
  useEffect(() => {
    editorPreview = props.editorPreview;
  }, []);

  if (value === null) {
    return null;
  }
  const html = markdownToHtml(value, { getAsset, resolveWidget });
  return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: html }} />;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  editorPreview: PropTypes.func.isRequired,
  resolveWidget: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
