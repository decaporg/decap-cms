import Ember from 'ember';

/**
@module app
@submodule components
*/

/**
  Breadcrumbs widget leaving a trail of crumbs.

  The default template can be overwritten by a "cms/breadcrumbs" template.

  @class CmsBreadcrumbs
  @extends Ember.Component
*/
export default Ember.Component.extend({
  tagName: "",


  /**
   An injected reference to the Ember router.

   @property router
  */
  router: null,
  /**
    An injected reference to the ApplicationController instance.

    @property applicationController
  */
  applicationController: null,

  /**
    Detect if there's a custom `cms/breadcrumbs` template, otherwise use the
    default `components/cms-breadcrumbs` template.

    @property layoutName
  */
  layoutName: function() {
    return this.container && this.container.lookup("template:cms/breadcrumbs") ?
           "cms/breadcrumbs" :
           "components/cms-breadcrumbs";
  }.property("controllers"),

  /* handlers for the current app.
     See https://github.com/chrisfarber/ember-breadcrumbs/blob/master/addon/components/bread-crumbs.js#L11
  */
  handlerInfos: function() {
    return this.get("router").router.currentHandlerInfos;
  }.property("applicationController.currentPath"),

  /* computed from the handler infos. */
  controllers: (function() {
    return this.get("handlerInfos").map(function(handlerInfo) {
      return handlerInfo.handler.controller;
    });
  }).property("handlerInfos.[]"),

  /**
    The breadcrumbs trail to the current path.

    Each crumbe is an object like:

    {label: String, path: String, model: Model, class: String, last: Bool}

    @property breadcrumbs
  */
  breadcrumbs: function() {
    var crumbs = [], last;
    this.get("controllers").forEach((controller) => {
      (controller.get("breadcrumbs") || []).forEach((crumb) => {
        crumbs.push(Ember.$.extend({class: "cms-breadcrumb-inactive"},crumb));
      });
    });

    last = crumbs[crumbs.length - 1];
    last.last = true;
    last.class = "cms-breadcrumb-active";

    return crumbs;
  }.property("controllers"),

  actions: {
    /**
      Transition to the path for a crumb.

      Use this in a custom breadcrumbs template like this:

      ```html
      {{#each crumb in breadcrumbs}}
      <a href="#" {{action "gotoCrumb" crumb}}>{{crumb.label}}</a>
      {{/each}}
      ```

      @method gotoCrumb
      @param {Object} crumb
    */
    gotoCrumb: function(crumb) {
      var appController = this.get("applicationController");
      var args = [crumb.path];
      if (crumb.model) {
        args.push(crumb.model);
      }
      appController.transitionToRoute.apply(appController, args);
    }
  }
});
