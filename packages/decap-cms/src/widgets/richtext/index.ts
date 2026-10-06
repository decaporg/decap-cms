// decap-cms-widget-richtext
//
// The `richtext` widget: a Plate/Slate visual editor over markdown. The field
// value is a markdown string in and a markdown string out; the Slate AST only
// exists while the editor is mounted. Serialization lives in `./serializers`,
// which is the part that must stay byte-faithful.

import controlComponent from './RichtextControl';
import previewComponent from './RichtextPreview';
import schema from './schema';

export interface RichtextWidgetDefinition {
  name: string;
  controlComponent: typeof controlComponent;
  previewComponent: typeof previewComponent;
  schema: typeof schema;
  // `registerWidget` takes a `WidgetRegistrationOptions`, which carries an
  // index signature so widgets can pass extra registration keys. Without one
  // here the closed interface is not assignable to it.
  [key: string]: unknown;
}

export function Widget(opts: Partial<RichtextWidgetDefinition> = {}): RichtextWidgetDefinition {
  return {
    name: 'richtext',
    controlComponent,
    previewComponent,
    schema,
    ...opts,
  };
}

export { controlComponent, previewComponent, schema };

// The editor component (shortcode) registry. Upstream Decap kept
// `registerEditorComponent` in core; this fork's core dropped it, so it lives
// with the only widget that uses it. Core re-exports this as a passthrough.
export {
  createEditorComponent,
  getEditorComponent,
  getEditorComponents,
  registerEditorComponent,
  unregisterEditorComponent,
} from './editorComponents';
export { default as imageEditorComponent } from './imageEditorComponent';

// Serializers, exported so consumers (and the preview pane) can reuse the exact
// markdown pipeline the editor uses.
export {
  htmlToSlate,
  markdownToHtml,
  markdownToRemark,
  markdownToSlate,
  remarkToMarkdown,
  slateToMarkdown,
} from './serializers/index';

export type {
  EditorComponent,
  EditorComponentField,
  EditorComponentOptions,
  EditorComponentsRegistry,
  MdastNode,
  MdastRoot,
  RichtextField,
  ShortcodeData,
  SlateMark,
  SlateMarkName,
  SlateNode,
  SlateNodeData,
} from './types';

export const DecapCmsWidgetRichtext = { Widget, controlComponent, previewComponent };
export default DecapCmsWidgetRichtext;
