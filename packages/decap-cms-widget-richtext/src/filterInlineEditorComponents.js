export default function filterInlineEditorComponents(editorComponents) {
  return editorComponents?.filter(({ type }) => type !== 'inline');
}
