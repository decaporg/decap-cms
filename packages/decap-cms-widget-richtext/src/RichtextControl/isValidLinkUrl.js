/**
 * Whether a string the editor typed or pasted may be used as a link
 * destination.
 *
 * The twin of `MarkdownControl/plugins/urls/isValidLinkUrl` in
 * decap-cms-widget-markdown. The two widgets already keep their own copies of
 * the shared serializers (`remarkPaddedLinks`, `remarkSquashReferences`,
 * `remarkSlate`), so this follows that seam rather than introducing a
 * dependency between them — but they encode one policy, and a change to either
 * belongs in both.
 *
 * Two rules:
 *
 * - No whitespace. The link prompt is the one place arbitrary clipboard
 *   contents can become a URL, and a pasted paragraph is still serialized as
 *   valid markdown — `[text](<a whole sentence>)` — so it survives save and
 *   commit and only surfaces later as a broken link, or as a failed build on a
 *   generator that resolves destinations against the filesystem. A real URL
 *   carries no raw whitespace; percent-encoding is how a space is expressed.
 * - No scheme that executes on click. `upsertLink` is called with
 *   `skipValidation`, so nothing else on this path rejects `javascript:`.
 */
const WHITESPACE = /\s/;

function isValidLinkUrl(url) {
  if (typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (trimmed === '') return false;
  if (WHITESPACE.test(trimmed)) return false;

  // Compared with whitespace stripped, so `java\tscript:` cannot slip past —
  // the whitespace rule above already rejects it, but this must not depend on
  // that ordering to be correct.
  const normalized = trimmed.replace(/\s+/g, '').toLowerCase();
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('file:') ||
    normalized.startsWith('data:')
  ) {
    return false;
  }

  return true;
}

export default isValidLinkUrl;
