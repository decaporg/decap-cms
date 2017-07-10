import { List } from 'immutable';
import { newEditorPlugin } from '../components/Widgets/MarkdownControlElements/plugins';

const _registry = {
  templates: {},
  previewStyles: [],
  widgets: {},
  editorComponents: List([])
};

export default {
  registerPreviewStyle(style) {
    _registry.previewStyles.push(style);
  },
  registerPreviewTemplate(name, component) {
    _registry.templates[name] = component;
  },
  getPreviewTemplate(name) {
    return _registry.templates[name];
  },
  getPreviewStyles() {
    return _registry.previewStyles;
  },
  registerWidget(name, control, preview) {
    // A registered widget control can be reused by a new widget, allowing
    // multiple copies with different previews.
    const newControl = typeof control === 'string' ? _registry.widgets[control].control : control;
    _registry.widgets[name] = { control: newControl, preview };
  },
  getWidget(name) {
    return _registry.widgets[name];
  },
  registerEditorComponent(component) {
    _registry.editorComponents = _registry.editorComponents.push(newEditorPlugin(component));
  },
  getEditorComponents() {
    return _registry.editorComponents;
  }
};
