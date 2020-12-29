import { fromJS } from 'immutable';
import { CONFIG_SUCCESS, ConfigAction } from '../actions/config';
import { Integrations } from '../types/redux';

interface Acc {
  providers: Record<string, {}>;
  hooks: Record<string, string | Record<string, string>>;
}

const defaultState = fromJS({ providers: {}, hooks: {} });

const integrations = (state = defaultState, action: ConfigAction): Integrations => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const integrations = action.payload.integrations || [];
      const newState = integrations.reduce(
        (acc, integration) => {
          const { hooks, collections, provider, ...providerData } = integration;
          acc.providers[provider] = { ...providerData };
          if (!collections) {
            hooks.forEach(hook => {
              acc.hooks[hook] = provider;
            });
            return acc;
          }
          const integrationCollections =
            collections === '*'
              ? action.payload.collections.map(collection => collection.name)
              : collections;
          integrationCollections.forEach(collection => {
            hooks.forEach(hook => {
              acc.hooks[collection]
                ? ((acc.hooks[collection] as Record<string, string>)[hook] = provider)
                : (acc.hooks[collection] = { [hook]: provider });
            });
          });
          return acc;
        },
        { providers: {}, hooks: {} } as Acc,
      );
      return fromJS(newState);
    }
    default:
      return state;
  }
};

export const selectIntegration = (state: Integrations, collection: string | null, hook: string) =>
  collection
    ? state.getIn(['hooks', collection, hook], false)
    : state.getIn(['hooks', hook], false);

export default integrations;
