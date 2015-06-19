import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
/* global define */

/**
@module app
*/

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

/**
  The global CMS object exposing methods for extending and configuring the CMS.

  @class CMS
  @static
*/
window.CMS = {};

/**
  Add a custom widget control.

  Takes the name of the widget and an object defining the behavior of the control.

  Each widget control is an Ember.Component, and can be paired with a handlebars template.

  From within the component you have access to the `widget` model.

  ## Usage:

  This defines a simple control that will toggle the widget value between true and false.

  ```javascript
  CMS.WidgetControl("foo", {
    actions: {
      toggle: function() {
        this.set("widget.value", this.get("widget.value") ? false : true);
      }
    }
  });
  ```

  To pair the widget control with a template, create a template in "cms/widgets/":

  ```html
  <script type="text/x-handlebars" data-template-name="cms/widgets/foo-control">
    <h2>{{widget.label}}</h2>
    <button class="button" {{action 'toggle'}}>Toogle Foo</button>
  </script>
  ```

  @method WidgetControl
  @param {String} name
  @param {Object} widget
*/
window.CMS.WidgetControl = function(name, widget) {
  define(`cms/components/cms/widgets/${name}-control`, ['exports'], function(exports) {
    exports['default'] = Ember.Component.extend(widget);
  });
};

/**
  Add a custom widget preview.

  Takes the name of the widget and an object defining the behavior of the preview.

  Each widget preview is an Ember.Component, and can be paired with a handlebars template.

  From within the component you have access to the `widget` model.

  ## Usage:

  This defines a simple preview component that'll reverse the string value of the
  widget by using one of Ember's computed properties.

  ```javascript
  CMS.WidgetPreview("foo", {
    reverseValue: function() {
      var value = this.get("widget.value") || "";
      var reversed = value.split("").reverse().join("");
      this.set("widget.reversed", reversed);
    }.observes("widget.value")
  });
  ```

  To pair the widget preview with a template, create a template in "cms/widgets/":

  ```html
  <script type="text/x-handlebars" data-template-name="cms/widgets/foo-preview">
    <h2>{{widget.reversed}}</h2>
  </script>
  ```

  @method WidgetPreview
  @param {String} name
  @param {Object} widget
*/
window.CMS.WidgetPreview = function(name, widget) {
  define(`cms/components/cms/widgets/${name}-preview`, ['exports'], function(exports) {
    exports['default'] = Ember.Component.extend(widget);
  });
};


/**
  Define a custom Format for reading and saving files.

  Each format needs to define `fromFile` and `toFile` methods and set an `extension` property..

  ## Usage

  ```javascript
  CMS.Format("txt", {
    extension: "txt",
    fromFile: function(content) {
      return {
        title: content.split("\n")[0],
        body: content
      };
    },
    toFile: function(obj) {
      return obj.body;
    }
  });
  ```

  @method Format
  @param {String} name
  @param {Object} format
*/
window.CMS.Format = function(name, format) {
  define("cms/formats/" + name, ['exports'], function(exports) {
    exports['default'] = Ember.Object.extend(format);
  });
};


window.CMS.Backend = function(name, backend) {
  define("cms/backends" + name, ['exports'], function(exports) {
    exports['default'] = Ember.Object.extend(backend);
  });
};

export default App;
