import { Map } from 'immutable';

import Algolia from './providers/algolia/implementation';
import AssetStore from './providers/assetStore/implementation';

export function resolveIntegrations(interationsConfig, getToken) {
  let integrationInstances = Map({});
  interationsConfig.get('providers').forEach((providerData, providerName) => {
    switch (providerName) {
      case 'algolia':
        integrationInstances = integrationInstances.set('algolia', new Algolia(providerData));
        break;
      case 'assetStore':
        integrationInstances = integrationInstances.set(
          'assetStore',
          new AssetStore(providerData, getToken),
        );
        break;
    }
  });
  return integrationInstances;
}

export const getIntegrationProvider = (function () {
  let integrations = null;

  return (interationsConfig, getToken, provider) => {
    if (integrations) {
      return integrations.get(provider);
    } else {
      integrations = resolveIntegrations(interationsConfig, getToken);
      return integrations.get(provider);
    }
  };
})();
