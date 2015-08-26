import Ember from 'ember';

export default Ember.Controller.extend({
  templateName: "index",
  needs: ['application'],
  prepare: function(config) {
    this.set("config", config);
  },
  collections: Ember.computed.alias("config.collections")
});
