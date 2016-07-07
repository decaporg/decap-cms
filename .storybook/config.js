import { configure } from '@kadira/storybook';
import '../src/index.css';

function loadStories() {
  require('../src/containers/stories/');
  require('../src/components/stories/');
}

configure(loadStories, module);
