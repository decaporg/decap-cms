import { Transforms } from 'slate';

import matchLink from '../../matchers/matchLink';

function unwrapLink(editor) {
  Transforms.unwrapNodes(editor, matchLink());
}

export default unwrapLink;
