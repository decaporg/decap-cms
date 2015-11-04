export default {
  initialize: function(instance) {
    var repo = instance.container.lookup("service:repository");
    var config = instance.container.lookup("cms:config");

    console.log(instance);
    console.log(instance.container);

    repo.backendFactory = instance.__container__.lookupFactory("backend:" + config.backend.name);
    repo.reset(config);
  }
};
