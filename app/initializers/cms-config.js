import Ember from "ember";
import Config from "../models/config";
 /* global jsyaml */

export function initialize(container, application) {
  application.deferReadiness();
  Ember.$.get("config.yml").then(function(data) {
    var config = Config.create(Ember.$.extend(jsyaml.safeLoad(data), {container: container}));
    config.set("container", container);
    application.register('cms:config', config, { instantiate: false });
    application.inject('route', 'config', 'cms:config');
    application.inject('service', 'config', 'cms:config');
    application.inject('model', 'config', 'cms:config');
    application.inject('component', 'config', 'cms:config');
    application.inject('route', 'authenticator', 'authenticator:netlify_github');
    application.advanceReadiness();
  });
}

export default {
  name: 'config-service',
  initialize: initialize
};
