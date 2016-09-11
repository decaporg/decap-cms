const _registry = {
  templates: {},
  previewStyles: [],
  widgets: {}
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
    _registry.widgets[name] = { control, preview };
  },
  getWidget(name) {
    return _registry.widgets[name];
  }
};
