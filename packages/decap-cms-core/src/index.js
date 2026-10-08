import bootstrap from './bootstrap';
import Registry, { setEditorApi } from './lib/registry';
import { editorApi } from './lib/editorApi';

setEditorApi(editorApi);

export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
  // The open entry, from outside React: CMS.editor.getCurrentEntry(),
  // .applyFieldPatch(patches) and .onEditorChange(listener). Experimental,
  // like registerFieldAction (spread in from Registry above): not yet a stable
  // public API, and may change or go away in any release. See index.d.ts.
  editor: editorApi,
};
export default DecapCmsCore;
