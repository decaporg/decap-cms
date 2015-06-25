export function initialize(container, application) {
  application.inject('route', 'authstore', 'service:authstore');
  application.inject('controller', 'authstore', 'service:authstore');
}

export default {
  name: 'authstore-service',
  initialize: initialize
};
