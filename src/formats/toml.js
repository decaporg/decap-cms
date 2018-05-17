import toml from 'toml-j0.4';
import tomlify from 'tomlify-j0.4';
import { sortKeys } from './helpers';

export default {
  fromFile(content) {
    return toml.parse(content);
  },

  toFile(data, sortedKeys = []) {
    return tomlify.toToml(data, { sort: sortKeys(sortedKeys) });
  }
}
