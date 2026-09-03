import { Component } from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';
import DOMPurify from 'dompurify';

import { markdownToHtml } from './serializers';

// DOMPurify's default ALLOWED_URI_REGEXP doesn't include the `blob:` scheme, so it strips
// `src` on any <img> pointing at a not-yet-committed asset - the editor always previews those
// via `URL.createObjectURL()` (a blob: URL) before the file has a real repo URL. Extend the
// default regex (see DOMPurify's own IS_ALLOWED_URI) to keep that scheme allowed while still
// stripping the actually dangerous ones (javascript:, vbscript:, etc.).
const SANITIZE_CONFIG = {
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

class MarkdownPreview extends Component {
  static propTypes = {
    getAsset: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(MarkdownPreview.propTypes, this.props, 'prop', 'MarkdownPreview');
  }

  render() {
    const { value, getAsset, resolveWidget, field, getRemarkPlugins } = this.props;
    if (value === null) {
      return null;
    }

    const html = markdownToHtml(value, { getAsset, resolveWidget }, getRemarkPlugins?.());
    const shouldSanitizePreview = field?.get('sanitize_preview') ?? true;
    const toRender = shouldSanitizePreview ? DOMPurify.sanitize(html, SANITIZE_CONFIG) : html;

    return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: toRender }} />;
  }
}

export default MarkdownPreview;
