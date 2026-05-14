import { Transforms } from 'slate';

function liftFirstMatchedParent(editor, format, options) {
  Transforms.liftNodes(editor, {
    match: n => n.type === format || (format === 'paragraph' && `${n.type}`.startsWith('heading')),
    mode: 'lowest',
    ...options,
  });
}

export default liftFirstMatchedParent;
