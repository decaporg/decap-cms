import Ember from "ember";
import Config from "../models/config";
 /* global jsyaml */
 /* global CMS_ENV */

function loadYamlConfig() {
  if (Ember.$("#cms-yaml-config").length) {
    return Ember.RSVP.Promise.resolve(Ember.$("#cms-yaml-config").html());
  } else {
    return Ember.$.get("config.yml");
  }
}

export function initialize(container, application) {
  application.deferReadiness();
  loadYamlConfig().then(function(yaml) {
    var data = jsyaml.safeLoad(yaml);

    if (typeof CMS_ENV === "string" && data[CMS_ENV]) {
      for (var key in data[CMS_ENV]) {
        if (data[CMS_ENV].hasOwnProperty(key)) {
          data[key] = data[CMS_ENV][key];
        }
      }
    }

    var config = Config.create(data);
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
