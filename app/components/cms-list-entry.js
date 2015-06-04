import Ember from 'ember';

export default Ember.Component.extend({
  actionsOpen: false,
  tagName: "",
  actions: {
    toggleActions: function() {
      this.set("actionsOpen", !this.get("actionsOpen"));
    },
    publish: function() {

    },
    duplicate: function() {

    },
    delete: function() {

    }
  }
});
