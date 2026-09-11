import getActiveLink from '../selectors/getActiveLink';
import unwrapLink from '../transforms/unwrapLink';
import wrapLink from '../transforms/wrapLink';
import isValidLinkUrl from '../../urls/isValidLinkUrl';

function toggleLink(editor, t) {
  const activeLink = getActiveLink(editor);
  const activeUrl = activeLink ? activeLink[0]?.data?.url : '';
  const input = window.prompt(t('editor.editorWidgets.markdown.linkPrompt'), activeUrl);
  if (input == null) return;

  const url = input.trim();

  if (url === '') {
    unwrapLink(editor);
    return;
  }

  if (!isValidLinkUrl(url)) {
    window.alert(t('editor.editorWidgets.markdown.linkPromptInvalid'));
    return;
  }

  wrapLink(editor, url);
}

export default toggleLink;
