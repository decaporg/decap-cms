import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';
import ImmutablePropTypes from 'react-immutable-proptypes';
import DOMPurify from 'dompurify';

import { markdownToHtml } from './serializers';

// Editors preview a selected-but-not-yet-committed image via URL.createObjectURL(), which
// produces a blob: URL - DOMPurify's default ALLOWED_URI_REGEXP doesn't include that scheme,
// so it strips `src` here even though the image is entirely local and safe.
//
// Widening ALLOWED_URI_REGEXP itself (as an earlier version of this fix did) allows blob: on
// every URI-bearing attribute DOMPurify checks - not just <img src>, but also <a href>,
// <form action>, etc. - which is a materially larger relaxation than this bug needs. A
// uponSanitizeAttribute hook scopes the exception to exactly <img src>; every other
// attribute/tag keeps DOMPurify's default (blob:-excluding) behaviour. The hook is added and
// removed around a single sanitize() call so it can never affect any other consumer of the
// shared `dompurify` module import elsewhere in the app.
//
// The allowed value is further restricted to this document's own origin: a blob: URL embeds
// the origin of the tab that created it (`blob:<origin>/<uuid>`) and a browser already refuses
// to dereference one minted by a different origin, so this check cannot relax anything a
// browser wouldn't already block - it only means a value that could not possibly be one of
// *this* CMS instance's own not-yet-committed asset previews is rejected before ever reaching
// the DOM, rather than being handed to the browser to fail on.
function isSameOriginBlobUrl(value) {
  return value.startsWith(`blob:${window.location.origin}/`);
}

function sanitizePreviewHtml(html) {
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.nodeName === 'IMG' && data.attrName === 'src' && isSameOriginBlobUrl(data.attrValue)) {
      data.forceKeepAttr = true;
    }
  });
  try {
    return DOMPurify.sanitize(html);
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
}

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
  const shouldSanitizePreview = field?.get('sanitize_preview') ?? true;
  const toRender = shouldSanitizePreview ? sanitizePreviewHtml(html) : html;

  // Inject block-specific styles into the iframe
  const previewStyles = `
    blockquote {
      padding-left: 16px;
      border-left: 3px solid #eff0f4;
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 16px;
    }
    
    code {
      background-color: #eff0f4;
      border-radius: 5px;
      padding: 0 2px;
      font-size: 85%;
      
    }
    
    pre {
      background-color: #eff0f4;
      border-radius: 5px;
      padding: 12px 16px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    
    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 85%;
      border-radius: 0;
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
