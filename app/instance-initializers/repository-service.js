import GithubAPI from '../backends/github_api';
import TestRepo from '../backends/test_repo';

export default {
  initialize: function(instance) {
    console.log("Initializing repo: %o", instance);

    var repo = instance.container.lookup("service:repository");
    var config = instance.container.lookup("cms:config");

    repo.backendFactory = instance.container.lookupFactory("backend:" + config.backend.name);
    console.log("reset from: %o", config);
    repo.reset(config);
  }
}
