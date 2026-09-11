// Shared by the two paths that can introduce a link destination into the
// document: HTML pasted into the editor (plugins/html/withHtml) and the URL
// prompt behind the toolbar link button (plugins/inlines/events/toggleLink).
// Keeping one copy of the policy stops the two from drifting apart.
function sanitizeElementUrl(url, { allowDataImage = false } = {}) {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\s+/g, '').toLowerCase();

  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('file:')
  ) {
    return null;
  }

  if (normalized.startsWith('data:')) {
    return allowDataImage && /^data:image\/(?!svg\+xml)[a-z0-9.+-]+[;,]/i.test(normalized)
      ? trimmed
      : null;
  }

  return trimmed;
}

export default sanitizeElementUrl;
