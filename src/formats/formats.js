import YAML from './yaml';
import JSONFormatter from './json';
import YAMLFrontmatter from './yaml-frontmatter';

const yamlFormatter = new YAML();
const jsonFormatter = new JSONFormatter();
const YamlFrontmatterFormatter = new YAMLFrontmatter();

function formatByType(type) {
  // Right now the only type is "editorialWorkflow" and
  // we always returns the same format
  return YamlFrontmatterFormatter;
}

export function formatByExtension(extension) {
  return {
    yml: yamlFormatter,
    json: jsonFormatter,
    md: YamlFrontmatterFormatter,
    markdown: YamlFrontmatterFormatter,
    html: YamlFrontmatterFormatter,
  }[extension] || YamlFrontmatterFormatter;
}

function formatByName(name) {
  return {
    yaml: yamlFormatter,
    frontmatter: YamlFrontmatterFormatter,
  }[name] || YamlFrontmatterFormatter;
}

export function resolveFormat(collectionOrEntity, entry) {
  if (typeof collectionOrEntity === 'string') {
    return formatByType(collectionOrEntity);
  }
  const path = entry && entry.path;
  if (path) {
    return formatByExtension(path.split('.').pop());
  }
  return formatByName(collectionOrEntity.get('format'));
}
