export function initialize(application) {
  application.inject('component', 'media', 'service:media');
  application.inject('service:repository', 'media', 'service:media');
}

export default {
  name: 'media-service',
  initialize: initialize
};
