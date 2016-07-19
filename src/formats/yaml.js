import yaml from 'js-yaml';
import moment from 'moment';
import MediaProxy from '../valueObjects/MediaProxy';

const MomentType = new yaml.Type('date', {
  kind: 'scalar',
  predicate: function(value) {
    return moment.isMoment(value);
  },
  represent: function(value) {
    return value.format(value._f);
  },
  resolve: function(value) {
    return moment.isMoment(value) && value._f;
  }
});

const ImageType = new yaml.Type('image', {
  kind: 'scalar',
  instanceOf: MediaProxy,
  represent: function(value) {
    return `${value.path}`;
  },
  resolve: function(value) {
    if (value === null) return false;
    if (value instanceof MediaProxy) return true;
    return false;
  }
});


const OutputSchema = new yaml.Schema({
  include: yaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType, ImageType].concat(yaml.DEFAULT_SAFE_SCHEMA.implicit),
  explicit: yaml.DEFAULT_SAFE_SCHEMA.explicit
});

export default class YAML {
  fromFile(content) {
    return yaml.safeLoad(content);
  }

  toFile(data) {
    return yaml.safeDump(data, {schema: OutputSchema});
  }
}
