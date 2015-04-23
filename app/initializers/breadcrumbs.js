export default {
  name: "ember-breadcrumbs",
  initialize: function(container, app) {
    app.inject("component:cms-breadcrumbs", "router", "router:main");
    app.inject("component:cms-breadcrumbs", "applicationController", "controller:application");
  }
};
