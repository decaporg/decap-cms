import DOMPurify from 'dompurify';

import { WidgetPreviewContainer } from '@/ui/default/index';
import { getEditorComponents } from './editorComponents';
import { markdownToHtml } from './serializers/index';

import type { CmsWidgetPreviewProps } from '@/lib/util/index';
import type { PluggableList } from 'unified';
import type { GetAssetFunction, ResolveWidgetFunction, RichtextField } from './types';

// Block-specific styles, injected into the preview iframe.
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

// Editors preview a selected-but-not-yet-committed image via
// `URL.createObjectURL()`, which produces a `blob:` URL. DOMPurify's default
// URI allow-list doesn't include that scheme, so it stripped `src` from exactly
// those images and the preview went blank (decaporg #7873).
//
// The exception is scoped to `<img src>` with a hook rather than by widening
// DOMPurify's ALLOWED_URI_REGEXP, which would also allow `blob:` on `<a href>`,
// `<form action>` and every other URI attribute. It is further limited to this
// document's own origin: a `blob:` URL embeds the origin that created it, so a
// value from any other origin can't be one of this CMS's own asset previews.
// The hook is added and removed around a single `sanitize()` call so it never
// affects other users of the shared DOMPurify instance.
function isSameOriginBlobUrl(value: string) {
  return value.startsWith(`blob:${window.location.origin}/`);
}

function sanitizePreviewHtml(html: string) {
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

export interface RichtextPreviewProps extends Omit<CmsWidgetPreviewProps<string, RichtextField>, 'getAsset'> {
  getAsset?: GetAssetFunction | undefined;
  resolveWidget?: ResolveWidgetFunction | undefined;
  getRemarkPlugins?: (() => PluggableList) | undefined;
}

export default function RichtextPreview({
  value,
  getAsset,
  resolveWidget,
  field,
  getRemarkPlugins,
}: RichtextPreviewProps) {
  if (value === null || value === undefined) {
    return null;
  }

  const html = markdownToHtml(value, {
    getAsset,
    resolveWidget,
    remarkPlugins: getRemarkPlugins?.() ?? [],
    editorComponents: getEditorComponents(),
  });

  const shouldSanitizePreview = field?.sanitize_preview ?? true;
  const toRender = shouldSanitizePreview ? sanitizePreviewHtml(html) : html;

  return (
    <WidgetPreviewContainer>
      <style>{previewStyles}</style>
      <div dangerouslySetInnerHTML={{ __html: toRender }} />
    </WidgetPreviewContainer>
  );
}
