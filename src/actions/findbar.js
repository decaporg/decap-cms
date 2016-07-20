import history from '../routing/history';
import { SEARCH } from '../containers/FindBar';

export const RUN_COMMAND = 'RUN_COMMAND';
export const SHOW_COLLECTION = 'SHOW_COLLECTION';
export const CREATE_COLLECTION = 'CREATE_COLLECTION';
export const HELP = 'HELP';

export function run(commandName, payload) {
  return { type: RUN_COMMAND, command: commandName, payload };
}

export function runCommand(commandName, payload) {
  return (dispatch, getState) => {
    switch (commandName) {
      case SHOW_COLLECTION:
        history.push(`/collections/${payload.collectionName}`);
        break;
      case CREATE_COLLECTION:
        window.alert(`Create a new ${payload.collectionName} - not supported yet`);
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
