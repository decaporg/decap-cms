export function initialize(container, application) {
  application.inject('controller', 'notifications', 'service:notifications');
}

export default {
  name: 'notifications-service',
  initialize: initialize
};
