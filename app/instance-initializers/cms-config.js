export default {
  initialize: function(instance) {
    var config = instance.container.lookup("cms:config");
    config.set("container", instance.container);
    config.set("ready", true);
  }
};
