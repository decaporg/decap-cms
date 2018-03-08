import { fromJS, List } from 'immutable';
import { CONFIG_SUCCESS } from 'Actions/config';

const integrations = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const integrations = action.payload.get('integrations', List()).toJS() || [];
      const newState = integrations.reduce((acc, integration) => {
        const { hooks, collections, provider, ...providerData } = integration;
        acc.providers[provider] = { ...providerData };
        if (!collections) {
          hooks.forEach((hook) => {
            acc.hooks[hook] = provider;
          });
          return acc;
        }
        const integrationCollections = collections === "*" ? action.payload.collections.map(collection => collection.name) : collections;
        integrationCollections.forEach((collection) => {
          hooks.forEach((hook) => {
            acc.hooks[collection] ? acc.hooks[collection][hook] = provider : acc.hooks[collection] = { [hook]: provider };
          });
        });
        return acc;
      }, { providers:{}, hooks: {} });
      return fromJS(newState);
    default:
      return state;
  }
};

export const selectIntegration = (state, collection, hook) => (
  collection? state.getIn(['hooks', collection, hook], false) : state.getIn(['hooks', hook], false)
);


export default integrations;
