import getActiveLink from '../selectors/getActiveLink';
import unwrapLink from '../transforms/unwrapLink';
import wrapLink from '../transforms/wrapLink';

function toggleLink(editor, promptText) {
  const activeLink = getActiveLink(editor);
  const url = window.prompt(promptText, activeLink?.url);
  if (url == null) return;
  if (url === '') {
    unwrapLink(editor);
    return;
  }
  wrapLink(editor, url);
}

export default toggleLink;
