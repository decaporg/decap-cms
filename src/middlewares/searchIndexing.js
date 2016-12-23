import { selectIntegration } from '../reducers';
import { getIntegrationProvider } from '../integrations';

const searchIndexing = store => next => action => {
  if (!action.indexSearch) return next(action);

  const { collection, entry } = action.payload;
  const state = store.getState();
  const integration = selectIntegration(state, collection.get('name'), 'search');
  const provider = getIntegrationProvider(state.integrations, integration);

  provider.addOrUpdateIndex(collection, entry);

  return next(action);
};

export default searchIndexing;
