import { Transforms } from 'slate';

import lowestMatchedAncestor from '../../matchers/lowestMatchedAncestor';

function unwrapFirstMatchedParent(editor, format) {
  Transforms.unwrapNodes(editor, lowestMatchedAncestor(editor, format));
}

export default unwrapFirstMatchedParent;
