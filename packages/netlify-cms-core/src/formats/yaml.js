import yaml from 'js-yaml';
import moment from 'moment';
import AssetProxy from 'ValueObjects/AssetProxy';
import { sortKeys } from './helpers';

const MomentType = new yaml.Type('date', {
  kind: 'scalar',
  predicate(value) {
    return moment.isMoment(value);
  },
  represent(value) {
    return value.format(value._f);
  },
  resolve(value) {
    return moment.isMoment(value) && value._f;
  },
});

const ImageType = new yaml.Type('image', {
  kind: 'scalar',
  instanceOf: AssetProxy,
  represent(value) {
    return `${value.path}`;
  },
  resolve(value) {
    if (value === null) return false;
    if (value instanceof AssetProxy) return true;
    return false;
  },
});

const OutputSchema = new yaml.Schema({
  include: yaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType, ImageType].concat(yaml.DEFAULT_SAFE_SCHEMA.implicit),
  explicit: yaml.DEFAULT_SAFE_SCHEMA.explicit,
});

export default {
  fromFile(content) {
    return yaml.safeLoad(content);
  },

  toFile(data, sortedKeys = []) {
    return yaml.safeDump(data, { schema: OutputSchema, sortKeys: sortKeys(sortedKeys) });
  },
};
