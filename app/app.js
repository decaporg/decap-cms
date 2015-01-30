import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
/* global define */

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

// Expose Global API for extending the CMS
window.CMSComponent = function(name, component) {
  define("cms/components/" + name, ['exports'], function(exports) {
    exports['default'] = Ember.Component.extend(component);
  });
};

window.CMSFormat = function(name, format) {
  define("cms/formats/" + name, ['exports'], function(exports) {
    exports['default'] = Ember.Object.extend(format);
  });
};

export default App;
