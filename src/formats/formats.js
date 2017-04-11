import YAML from './yaml';
import JSONFormatter from './json';
import Frontmatter from './frontmatter';

const yamlFormatter = new YAML();
const jsonFormatter = new JSONFormatter();
const FrontmatterFormatter = new Frontmatter();

function formatByType(type) {
  // Right now the only type is "editorialWorkflow" and
  // we always returns the same format
  return FrontmatterFormatter;
}

export function formatByExtension(extension) {
  return {
    yml: yamlFormatter,
    json: jsonFormatter,
    md: FrontmatterFormatter,
    markdown: FrontmatterFormatter,
    html: FrontmatterFormatter,
  }[extension] || FrontmatterFormatter;
}

function formatByName(name) {
  return {
    yaml: yamlFormatter,
    frontmatter: FrontmatterFormatter,
  }[name] || FrontmatterFormatter;
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
