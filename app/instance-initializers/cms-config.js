export default {
  initialize: function(instance) {
    console.log("Hello from initialize");
    var config = instance.container.lookup("cms:config");
    console.log("Have config %o, settings container %o", config, instance.container);
    config.set("container", instance.container);
    config.set("ready", true);
  }
}
