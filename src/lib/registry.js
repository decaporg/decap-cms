import { Map } from 'immutable';
import { newEditorPlugin } from '../EditorWidgets/Markdown/MarkdownControl/plugins';

/**
 * Global Registry Object
 */
const registry = {
  templates: {},
  previewStyles: [],
  widgets: {},
  editorComponents: Map(),
  widgetValueSerializers: {},
};


export default {
  /**
   * Preview Styles
   */
  registerPreviewStyle(style) {
    registry.previewStyles.push(style);
  },
  getPreviewStyles() {
    return registry.previewStyles;
  },


  /**
   * Preview Templates
   */
  registerPreviewTemplate(name, component) {
    registry.templates[name] = component;
  },
  getPreviewTemplate(name) {
    return registry.templates[name];
  },


  /**
   * Editor Widgets
   */
  registerWidget(name, control, preview) {
    // A registered widget control can be reused by a new widget, allowing
    // multiple copies with different previews.
    const newControl = typeof control === 'string' ? registry.widgets[control].control : control;
    registry.widgets[name] = { control: newControl, preview };
  },
  getWidget(name) {
    return registry.widgets[name];
  },
  resolveWidget(name) {
    return this.getWidget(name || 'string') || this.getWidget('unknown');
  },


  /**
   * Markdown Editor Custom Components
   */
  registerEditorComponent(component) {
    const plugin = newEditorPlugin(component);
    registry.editorComponents = registry.editorComponents.set(plugin.get('id'), plugin);
  },
  getEditorComponents() {
    return registry.editorComponents;
  },


  /**
   * Widget Serializers
   */
  registerWidgetValueSerializer(widgetName, serializer) {
    registry.widgetValueSerializers[widgetName] = serializer;
  },
  getWidgetValueSerializer(widgetName) {
    return registry.widgetValueSerializers[widgetName];
  },
}
