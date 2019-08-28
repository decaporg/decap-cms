import toml from '@iarna/toml';
import tomlify from 'tomlify-j0.4';
import moment from 'moment';
import AssetProxy from 'ValueObjects/AssetProxy';
import { sortKeys } from './helpers';

const outputReplacer = (key, value) => {
  if (moment.isMoment(value)) {
    return value.format(value._f);
  }
  if (value instanceof AssetProxy) {
    return `${value.path}`;
  }
  if (Number.isInteger(value)) {
    // Return the string representation of integers so tomlify won't render with tenths (".0")
    return value.toString();
  }
  // Return `false` to use default (`undefined` would delete key).
  return false;
};

export default {
  fromFile(content) {
    return toml.parse(content);
  },

  toFile(data, sortedKeys = []) {
    return tomlify.toToml(data, { replace: outputReplacer, sort: sortKeys(sortedKeys) });
  },
};
