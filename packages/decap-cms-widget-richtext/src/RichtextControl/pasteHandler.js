import { htmlToSlate } from '../serializers';

export function getHtmlFragment(html, deserialize = htmlToSlate) {
  if (!html) {
    return null;
  }

  const slateRaw = deserialize(html);
  const fragment = slateRaw && Array.isArray(slateRaw.children) ? slateRaw.children : null;

  if (!fragment || fragment.length === 0) {
    return null;
  }

  return fragment;
}

export function handlePasteHtml({ event, editor, isDisabled, deserialize = htmlToSlate }) {
  if (isDisabled || !event || !event.clipboardData) {
    return false;
  }

  const html = event.clipboardData.getData('text/html');

  if (!html) {
    return false;
  }

  let fragment;

  try {
    fragment = getHtmlFragment(html, deserialize);
  } catch {
    return false;
  }

  if (!fragment) {
    return false;
  }

  event.preventDefault();

  if (editor && editor.tf && typeof editor.tf.insertFragment === 'function') {
    editor.tf.insertFragment(fragment);
    return true;
  }

  if (editor && editor.tf && typeof editor.tf.insertNodes === 'function') {
    editor.tf.insertNodes(fragment);
    return true;
  }

  return false;
}