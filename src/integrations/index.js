import Algolia from './providers/algolia/implementation';
import AssetStore from './providers/assetStore/implementation';
import { Map } from 'immutable';

export function resolveIntegrations(interationsConfig, authToken) {
  let integrationInstances = Map({});
  interationsConfig.get('providers').forEach((providerData, providerName) => {
    switch (providerName) {
      case 'algolia':
        integrationInstances = integrationInstances.set('algolia', new Algolia(providerData));
        break;
      case 'assetStore':
        integrationInstances = integrationInstances.set('assetStore', new AssetStore(providerData, authToken));
        break;
    }
  });
  return integrationInstances;
}


export const getIntegrationProvider = (function() {
  let integrations = null;

  return (interationsConfig, authToken, provider) => {
    if (integrations) {
      return integrations.get(provider);
    } else {
      integrations = resolveIntegrations(interationsConfig, authToken);
      return integrations.get(provider);
    }
  };
}());
