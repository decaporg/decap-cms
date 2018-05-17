import yaml from 'js-yaml';
import { sortKeys } from './helpers';

export default {
  fromFile(content) {
    return yaml.safeLoad(content, { schema: yaml.CORE_SCHEMA });
  },

  toFile(data, sortedKeys = []) {
    return yaml.safeDump(data, { schema: yaml.CORE_SCHEMA, sortKeys: sortKeys(sortedKeys) });
  }
}
