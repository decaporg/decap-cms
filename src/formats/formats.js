import YAML from './yaml';
import YAMLFrontmatter from './yaml-frontmatter';

const yamlFormatter = new YAML();
const YamlFrontmatterFormatter = new YAMLFrontmatter();

export function resolveFormat(collection, entry) {
  const extension = entry.path.split('.').pop();
  switch (extension) {
    case 'yml':
      return yamlFormatter;
    default:
      return YamlFrontmatterFormatter;
  }
}
