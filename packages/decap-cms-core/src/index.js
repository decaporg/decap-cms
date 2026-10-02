import bootstrap from './bootstrap';
import Registry, { setEditorApi } from './lib/registry';
import { editorApi } from './lib/editorApi';

setEditorApi(editorApi);

export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
  // The open entry, from outside React: CMS.editor.getCurrentEntry(),
  // .applyFieldPatch(patches) and .onEditorChange(listener).
  editor: editorApi,
};
export default DecapCmsCore;
