import GithubAPI from '../backends/github_api';
import TestRepo from '../backends/test_repo';

export default {
  initialize: function(instance) {
    var repo = instance.container.lookup("service:repository");
    var config = instance.container.lookup("cms:config");

    repo.backendFactory = instance.container.lookupFactory("backend:" + config.backend.name);
    repo.reset(config);
  }
}
