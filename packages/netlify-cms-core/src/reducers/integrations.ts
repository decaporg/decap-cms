import { fromJS, List } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';
import { Integrations, IntegrationsAction, Integration } from '../types/redux';

interface Acc {
  providers: Record<string, {}>;
  hooks: Record<string, string | Record<string, string>>;
}

const integrations = (state = null, action: IntegrationsAction): Integrations | null => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const integrations: Integration[] = action.payload.get('integrations', List()).toJS() || [];
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
              ? action.payload.get('collections').map(collection => collection.get('name'))
              : (collections as string[]);
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
