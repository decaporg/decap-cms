export function initialize(container, application) {
  application.inject('route', 'repository', 'service:repository');
}

export default {
  name: 'repository-service',
  initialize: initialize
};
