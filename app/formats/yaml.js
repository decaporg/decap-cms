import Ember from 'ember';
/* global jsyaml */
/* global moment */

var MomentType = new jsyaml.Type('date', {
  kind: 'scalar',
  predicate: function(value) {
    return moment.isMoment(value);
  },
  represent: function(value) {
    return value.format(value._f);
  }
});

var OutputSchema = new jsyaml.Schema({
  include: jsyaml.DEFAULT_SAFE_SCHEMA.include,
  implicit: [MomentType].concat(jsyaml.DEFAULT_SAFE_SCHEMA.implicit),
  explicit: jsyaml.DEFAULT_SAFE_SCHEMA.explicit
});

export default Ember.Object.extend({
  extension: "yml",
  fromFile: function(content) {
    return jsyaml.safeLoad(content);
  },
  toFile: function(data) {
    return jsyaml.safeDump(data, {schema: OutputSchema});
  },
  excerpt: function() {
    return "A YAML Document";
  }
});
