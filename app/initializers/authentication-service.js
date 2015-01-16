export function initialize(container, application) {
  application.inject('route', 'authentication', 'service:authentication');
}

export default {
  name: 'authentication-service',
  initialize: initialize
};
