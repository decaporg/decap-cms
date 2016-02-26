import yaml from 'js-yaml';
import moment from 'moment';

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

const OutputSchema = new yaml.Schema({
  include: yaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType].concat(yaml.DEFAULT_SAFE_SCHEMA.implicit),
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
