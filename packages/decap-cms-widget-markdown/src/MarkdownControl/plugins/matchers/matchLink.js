import { Editor, Element } from 'slate';

function matchLink() {
  return {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
  };
}

export default matchLink;
