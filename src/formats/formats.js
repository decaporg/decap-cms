import YAML from './yaml';
import YAMLFrontmatter from './yaml-frontmatter';

const yamlFormatter = new YAML();
const YamlFrontmatterFormatter = new YAMLFrontmatter();

function formatByType(type) {
  // Right now the only type is "editorialWorkflow" and
  // we always returns the same format
  return YamlFrontmatterFormatter;
}

function formatByExtension(extension) {
  return {
    'yml': yamlFormatter,
    'md': YamlFrontmatterFormatter,
    'markdown': YamlFrontmatterFormatter,
    'html': YamlFrontmatterFormatter
  }[extension] || YamlFrontmatterFormatter;
}

function formatByName(name) {
  return {
    'yaml': yamlFormatter,
    'frontmatter': YamlFrontmatterFormatter
  }[name] || YamlFrontmatterFormatter;
}

export function resolveFormat(collectionOrEntity, entry) {
  if (typeof collectionOrEntity === 'string') {
    return formatByType(collectionOrEntity);
  }
  if (entry && entry.path) {
    return formatByExtension(entry.path.split('.').pop());
  }
  return formatByName(collectionOrEntity.get('format'));
}
