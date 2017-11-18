import yamlFormatter from './yaml';
import tomlFormatter from './toml';
import jsonFormatter from './json';
import FrontmatterFormatter from './frontmatter';

export const formatToExtension = format => ({
  markdown: 'md',
  yaml: 'yml',
  toml: 'toml',
  json: 'json',
  html: 'html',
}[format]);

export function formatByExtension(extension) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    md: FrontmatterFormatter,
    markdown: FrontmatterFormatter,
    html: FrontmatterFormatter,
  }[extension] || FrontmatterFormatter;
}

function formatByName(name) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    frontmatter: FrontmatterFormatter,
  }[name] || FrontmatterFormatter;
}

export function resolveFormat(collectionOrEntity, entry) {
  const path = entry && entry.path;
  if (path) {
    return formatByExtension(path.split('.').pop());
  }
  return formatByName(collectionOrEntity.get('format'));
}
