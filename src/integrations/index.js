import Algolia from './providers/algolia/implementation';
import NetlifyAsset from './providers/netlifyAsset/implementation';
import { Map } from 'immutable';

export function resolveIntegrations(interationsConfig) {
  let integrationInstances = Map({});
  interationsConfig.get('providers').forEach((providerData, providerName) => {
    switch (providerName) {
      case 'algolia':
        integrationInstances = integrationInstances.set('algolia', new Algolia(providerData));
        break;
      case 'netlifyAsset':
        integrationInstances = integrationInstances.set('netlifyAsset', new NetlifyAsset(providerData));
        break;
    }
  });
  return integrationInstances;
}


export const getIntegrationProvider = (function() {
  let integrations = null;

  return (interationsConfig, provider) => {
    if (integrations) {
      return integrations.get(provider);
    } else {
      integrations = resolveIntegrations(interationsConfig);
      return integrations.get(provider);
    }
  };
}());
