import { unwrapLink, upsertLink } from '@platejs/link';

import isValidLinkUrl from './isValidLinkUrl';

export function handleLinkClick({ editor, t }) {
  const input = window.prompt(t('editor.editorWidgets.markdown.linkPrompt'), '');
  if (input === null) return;

  const url = input.trim();

  if (url === '') {
    unwrapLink(editor);
    return;
  }

  if (!isValidLinkUrl(url)) {
    window.alert(t('editor.editorWidgets.markdown.linkPromptInvalid'));
    return;
  }

  // `skipValidation` stays on deliberately. Plate's own check rejects relative
  // destinations — `/about`, `../sibling`, `#section` — which are ordinary in a
  // CMS, so isValidLinkUrl REPLACES it rather than adding to it, and is now the
  // only thing standing between the prompt and the document.
  upsertLink(editor, { url, skipValidation: true });
}
