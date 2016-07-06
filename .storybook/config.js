import { configure } from '@kadira/storybook';

function loadStories() {
  require('../src/index.css');
  require('../src/containers/stories/');
  require('../src/components/stories/');
}

configure(loadStories, module);
