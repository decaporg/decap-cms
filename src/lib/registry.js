import { List } from 'immutable';
import { newEditorPlugin } from '../components/Widgets/MarkdownControlElements/plugins';

const registry = {
  templates: {},
  previewStyles: [],
  widgets: {},
  editorComponents: List([]),
};

export default {
  registerPreviewStyle(style) {
    registry.previewStyles.push(style);
  },
  registerPreviewTemplate(name, component) {
    registry.templates[name] = component;
  },
  getPreviewTemplate(name) {
    return registry.templates[name];
  },
  getPreviewStyles() {
    return registry.previewStyles;
  },
  registerWidget(name, control, preview) {
    registry.widgets[name] = { control, preview };
  },
  getWidget(name) {
    return registry.widgets[name];
  },
  registerEditorComponent(component) {
    registry.editorComponents = registry.editorComponents.push(newEditorPlugin(component));
  },
  getEditorComponents() {
    return registry.editorComponents;
  },
};
