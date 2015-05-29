import Ember from 'ember';

export default Ember.Controller.extend({
  templateName: "application",
  breadcrumbs: [{
    label: "Content",
    path: "index"
  }]
});
