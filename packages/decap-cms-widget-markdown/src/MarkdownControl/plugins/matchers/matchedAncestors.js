import { Editor, Element } from 'slate';

function matchedAncestors(editor, format, mode) {
  return {
    match: n =>
      (!Editor.isEditor(n) &&
        Element.isElement(n) &&
        Editor.isBlock(editor, n) &&
        (n.type === format ||
          (format === 'heading' && `${n.type}`.startsWith('heading-')) ||
          (format === 'paragraph' && `${n.type}`.startsWith('heading-')) ||
          (format === 'block' && !`${n.type}`.startsWith('heading-') && n.type !== 'paragraph') ||
          (format === 'list' && `${n.type}`.endsWith('-list')))) ||
      (format === 'non-default' && n.type !== 'paragraph'),
    mode,
  };
}
export default matchedAncestors;
