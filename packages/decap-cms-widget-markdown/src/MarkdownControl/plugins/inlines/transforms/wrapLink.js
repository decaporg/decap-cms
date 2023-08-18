import { Range, Transforms } from 'slate';

import getActiveLink from '../selectors/getActiveLink';
import matchLink from '../../matchers/matchLink';

function wrapLink(editor, url) {
  if (getActiveLink(editor)) {
    Transforms.setNodes(editor, { data: { url } }, matchLink());
    return;
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = {
    type: 'link',
    data: {
      url,
    },
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
}

export default wrapLink;
