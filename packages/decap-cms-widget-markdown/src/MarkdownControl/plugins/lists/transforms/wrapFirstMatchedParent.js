import { Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function wrapFirstMatchedParent(editor, format, node) {
  Transforms.wrapNodes(editor, node, lowestMatchedAncestor(editor, format));
}

export default wrapFirstMatchedParent;
