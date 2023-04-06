import { Transforms } from "slate";

function unwrapFirstMatchedParent(editor, format, options) {
  Transforms.unwrapNodes(
    editor,
    {
      match: n => n.type === format || (format === 'paragraph' && `${n.type}`.startsWith('heading')),
      mode: 'lowest',
      ...options,
    },
  );
}

export default unwrapFirstMatchedParent;
