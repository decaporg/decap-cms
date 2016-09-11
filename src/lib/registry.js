const registry = {
  templates: {},
  previewStyles: []
};

export function registerPreviewStyle(style) {
  registry.previewStyles.push(style);
}

export function registerPreviewTemplate(name, component) {
  registry.templates[name] = component;
}

export function getPreviewTemplate(name) {
  return registry.templates[name];
}

export function getPreviewStyles() {
  return registry.previewStyles;
}
