import history from '../routing/history';
import { SEARCH } from '../components/FindBar/FindBar';

export const RUN_COMMAND = 'RUN_COMMAND';
export const SHOW_COLLECTION = 'SHOW_COLLECTION';
export const CREATE_COLLECTION = 'CREATE_COLLECTION';
export const HELP = 'HELP';

export function run(commandName, payload) {
  return { type: RUN_COMMAND, command: commandName, payload };
}

export function navigateToCollection(collectionName) {
  return runCommand(SHOW_COLLECTION, { collectionName });
}

export function createNewEntryInCollection(collectionName) {
  return runCommand(CREATE_COLLECTION, { collectionName });
}

export function runCommand(commandName, payload) {
  return dispatch => {
    switch (commandName) {
      case SHOW_COLLECTION:
        history.push(`/collections/${payload.collectionName}`);
        break;
      case CREATE_COLLECTION:
        history.push(`/collections/${payload.collectionName}/entries/new`);
        break;
      case HELP:
        window.alert('Find Bar Help (PLACEHOLDER)\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.');
        break;
      case SEARCH:
        history.push(`/search/${payload.searchTerm}`);
        break;
    }
    dispatch(run(commandName, payload));
  };
}
