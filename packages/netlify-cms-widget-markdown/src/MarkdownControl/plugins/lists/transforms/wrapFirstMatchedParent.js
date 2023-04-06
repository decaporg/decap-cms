import { Transforms } from "slate";

function wrapFirstMatchedParent(editor, format, node) {
  Transforms.wrapNodes(
    editor,
    node,
    {
      match: n => n.type === format || (format === 'paragraph' && `${n.type}`.startsWith('heading')),
      mode: 'lowest',
    },
  );
}

export default wrapFirstMatchedParent;
