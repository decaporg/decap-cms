import toml from '@iarna/toml';
import tomlify from 'tomlify-j0.4';
import dayjs from 'dayjs';

import AssetProxy from '../valueObjects/AssetProxy';
import { sortKeys } from './helpers';

function outputReplacer(_key: string, value: unknown) {
  if (dayjs.isDayjs(value)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return value.format(value._f);
  }
  if (value instanceof AssetProxy) {
    return `${value.path}`;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    // Return the string representation of integers so tomlify won't render with tenths (".0")
    return value.toString();
  }
  // Return `false` to use default (`undefined` would delete key).
  return false;
}

export default {
  fromFile(content: string) {
    return toml.parse(content);
  },

  toFile(data: object, sortedKeys: string[] = []) {
    return tomlify.toToml(data, { replace: outputReplacer, sort: sortKeys(sortedKeys) });
  },
};
