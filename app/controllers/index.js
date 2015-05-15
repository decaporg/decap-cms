import Ember from 'ember';

export default Ember.Controller.extend({
  templateName: "index",
  needs: ['application'],
  prepare: function(config) {
    this.set("config", config);
    this.set("controllers.application.currentAction", "Index");
  },
  collections: Ember.computed.alias("config.collections")
});
