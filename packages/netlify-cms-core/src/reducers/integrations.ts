import { fromJS, List } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';
import { Integrations, IntegrationsAction, Integration, Config } from '../types/redux';

interface Acc {
  providers: Record<string, {}>;
  hooks: Record<string, string | Record<string, string>>;
}

export const getIntegrations = (config: Config) => {
  const integrations: Integration[] = config.get('integrations', List()).toJS() || [];
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
          ? config
              .get('collections')
              .map(collection => collection!.get('name'))
              .toArray()
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
};

const integrations = (state = null, action: IntegrationsAction): Integrations | null => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      return getIntegrations(action.payload);
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
