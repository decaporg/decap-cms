import { resolvePath } from '../lib/pathHelper';
import { getIntegrationProvider } from '../integrations';
import { selectIntegration } from '../reducers';

let store;
export const setStore = (storeObj) => {
  store = storeObj;
};

export default function MediaProxy(value, file, uploaded = false) {
  const config = store.getState().config;
  this.value = value;
  this.file = file;
  this.uploaded = uploaded;
  this.sha = null;
  this.path = config.media_folder && !uploaded ? `${ config.media_folder }/${ value }` : value;
  this.public_path = !uploaded ? resolvePath(value, config.public_folder) : value;
}

MediaProxy.prototype.toString = function () {
  return this.uploaded ? this.public_path : window.URL.createObjectURL(this.file, { oneTimeOnly: true });
};

MediaProxy.prototype.toBase64 = function () {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (readerEvt) => {
      const binaryString = readerEvt.target.result;

      resolve(binaryString.split('base64,')[1]);
    };
    fr.readAsDataURL(this.file);
  });
};

export function createMediaProxy(value, file, uploaded = false) {
  const state = store.getState();
  const integration = selectIntegration(state, null, 'assetProxy');
  if (integration && !uploaded) {
    const provider = integration && getIntegrationProvider(state.integrations, integration);
    return provider.upload(file).then(
      response => (
        new MediaProxy(response.assetURL.replace(/^(https?|ftp):/, ''), null, true)
      ),
      error => new MediaProxy(value, file, false)
    );  
  }
  
  return Promise.resolve(new MediaProxy(state.config, value, file, uploaded));
}
