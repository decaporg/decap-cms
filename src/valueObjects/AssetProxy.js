import { resolvePath } from '../lib/pathHelper';
import { getIntegrationProvider } from '../integrations';
import { selectIntegration } from '../reducers';

let store;
export const setStore = (storeObj) => {
  store = storeObj;
};

export default function AssetProxy(value, file, uploaded = false) {
  const config = store.getState().config;
  this.value = value;
  this.file = file;
  this.uploaded = uploaded;
  this.sha = null;
  this.path = config.media_folder && !uploaded ? `${ config.get('media_folder') }/${ value }` : value;
  this.public_path = !uploaded ? resolvePath(value, config.get('public_folder')) : value;
}

AssetProxy.prototype.toString = function () {
  return this.uploaded ? this.public_path : window.URL.createObjectURL(this.file, { oneTimeOnly: true });
};

AssetProxy.prototype.toBase64 = function () {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (readerEvt) => {
      const binaryString = readerEvt.target.result;

      resolve(binaryString.split('base64,')[1]);
    };
    fr.readAsDataURL(this.file);
  });
};

export function createAssetProxy(value, file, uploaded = false) {
  const state = store.getState();
  const integration = selectIntegration(state, null, 'assetStore');
  if (integration && !uploaded) {
    const provider = integration && getIntegrationProvider(state.integrations, integration);
    return provider.upload(file).then(
      response => (
        new AssetProxy(response.assetURL.replace(/^(https?):/, ''), null, true)
      ),
      error => new AssetProxy(value, file, false)
    );  
  }
  
  return Promise.resolve(new AssetProxy(value, file, uploaded));
}
