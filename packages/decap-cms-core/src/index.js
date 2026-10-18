import bootstrap from './bootstrap';
import Registry, { setEditorApi } from './lib/registry';
import { editorApi } from './lib/editorApi';

setEditorApi(editorApi);

export const DecapCmsCore = {
  ...Registry,
  init: bootstrap,
  // The open entry, from outside React. Experimental, like registerFieldAction:
  // may change or go away in any release. See index.d.ts.
  editor: editorApi,
};
export default DecapCmsCore;
