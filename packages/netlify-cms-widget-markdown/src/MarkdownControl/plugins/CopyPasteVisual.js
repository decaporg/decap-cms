import { Document } from 'slate';
import base64 from 'slate-base64-serializer';
import isHotkey from 'is-hotkey';
import { slateToMarkdown, markdownToSlate, htmlToSlate, markdownToHtml } from '../../serializers';

const CopyPasteVisual = ({ getAsset, resolveWidget }) => ({
  onPaste(event, editor, next) {
    const data = event.clipboardData;
    if (isHotkey('shift', event)) {
      return next();
    }

    if (data.types.includes('application/x-slate-fragment')) {
      const fragment = base64.deserializeNode(data.getData('application/x-slate-fragment'));
      return editor.insertFragment(fragment);
    }

    const html = data.types.includes('text/html') && data.getData('text/html');
    const ast = html ? htmlToSlate(html) : markdownToSlate(data.getData('text/plain'));
    const doc = Document.fromJSON(ast);
    return editor.insertFragment(doc);
  },
  onCopy(event, editor, next) {
    const markdown = slateToMarkdown(editor.value.fragment.toJS());
    const html = markdownToHtml(markdown, { getAsset, resolveWidget });
    setEventTransfer(event, 'text', markdown);
    setEventTransfer(event, 'html', html);
    setEventTransfer(event, 'fragment', serializeNode(editor.value.fragment));
    event.preventDefault();
  },
  onCut(event, editor, next){
    this.handleCopy(event, editor, next);
    editor.delete();
  },
});

export default CopyPasteVisual;
