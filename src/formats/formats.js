import yamlFormatter from './yaml';
import tomlFormatter from './toml';
import jsonFormatter from './json';
import FrontmatterFormatter from './frontmatter';

export const supportedFormats = [
  'yml',
  'yaml',
  'toml',
  'json',
  'frontmatter',
];

export const formatToExtension = format => ({
  yml: 'yml',
  yaml: 'yml',
  toml: 'toml',
  json: 'json',
  frontmatter: 'md',
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
  }[extension];
}

function formatByName(name) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    frontmatter: FrontmatterFormatter,
  }[name];
}

export function resolveFormat(collectionOrEntity, entry) {
  // If the format is specified in the collection, use that format.
  const format = collectionOrEntity.get('format');
  if (format) {
    return formatByName(format);
  }

  // If a file already exists, infer the format from its file extension.
  const filePath = entry && entry.path;
  if (filePath) {
    const fileExtension = filePath.split('.').pop();
    return formatByExtension(fileExtension);
  }

  // If creating a new file, and an `extension` is specified in the
  //   collection config, infer the format from that extension.
  const extension = collectionOrEntity.get('extension');
  if (extension) {
    return formatByExtension(extension);
  }

  // If no format is specified and it cannot be inferred, return the default.
  return formatByName('frontmatter');
}
