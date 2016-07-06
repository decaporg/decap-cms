import {configure} from '@kadira/storybook';

function loadStories() {
  require('../src/components/stories/');
}

configure(loadStories, module);
