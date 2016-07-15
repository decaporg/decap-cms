import history from '../routing/history';
import { SEARCH } from '../containers/FindBar';

export const RUN_COMMAND = 'RUN_COMMAND';
export const LIST_POSTS = 'LIST_POSTS';
export const LIST_FAQ = 'LIST_FAQ';
export const HELP = 'HELP';

export function run(commandName, payload) {
  return { type: RUN_COMMAND, command: commandName, payload };
}

export function runCommand(commandName, payload) {
  return (dispatch, getState) => {
    switch (commandName) {
      case LIST_POSTS:
        history.push('/collections/posts');
        break;
      case LIST_FAQ:
        history.push('/collections/faq');
        break;
      case HELP:
        window.alert('Find Bar Help (PLACEHOLDER)\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.');
        break;
      case SEARCH:
        history.push('/search');
        break;
    }
    dispatch(run(commandName, payload));
  };
}
