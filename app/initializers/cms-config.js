import Ember from "ember";
import Config from "../models/config";
 /* global jsyaml */

function loadYamlConfig() {
  if (Ember.$("#cms-yaml-config").length) {
    return Ember.RSVP.Promise.resolve(Ember.$("#cms-yaml-config").html());
  } else {
    return Ember.$.get("config.yml");
  }
}

export function initialize(container, application) {
  application.deferReadiness();
  loadYamlConfig().then(function(data) {
    var config = Config.create(jsyaml.safeLoad(data));
    application.register('cms:config', config, { instantiate: false });
    application.inject('route', 'config', 'cms:config');
    application.inject('controller', 'config', 'cms:config');
    application.inject('service', 'config', 'cms:config');
    application.inject('model', 'config', 'cms:config');
    application.inject('component', 'config', 'cms:config');
    application.advanceReadiness();
  });
}

export default {
  name: 'config-service',
  initialize: initialize
};
