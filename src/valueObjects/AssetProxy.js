import { resolvePath } from 'Lib/pathHelper';
import { currentBackend } from "Backends/backend";
import { getIntegrationProvider } from 'Integrations';
import { selectIntegration } from 'Reducers';

let store;
export const setStore = (storeObj) => {
  store = storeObj;
};

export default function AssetProxy(value, fileObj, uploaded = false, asset) {
  const config = store.getState().config;
  this.value = value;
  this.fileObj = fileObj;
  this.uploaded = uploaded;
  this.sha = null;
  this.path = config.get('media_folder') && !uploaded ? resolvePath(value, config.get('media_folder')) : value;
  this.public_path = !uploaded ? resolvePath(value, config.get('public_folder')) : value;
  this.asset = asset;
}

AssetProxy.prototype.toString = function () {
  // Use the deployed image path if we do not have a locally cached copy.
  if (this.uploaded && !this.fileObj) return this.public_path;
  try {
    return window.URL.createObjectURL(this.fileObj);
  } catch (error) {
    return null;
  }
};

AssetProxy.prototype.toBase64 = function () {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (readerEvt) => {
      const binaryString = readerEvt.target.result;

      resolve(binaryString.split('base64,')[1]);
    };
    fr.readAsDataURL(this.fileObj);
  });
};

export function createAssetProxy(value, fileObj, uploaded = false, privateUpload = false) {
  const state = store.getState();
  const integration = selectIntegration(state, null, 'assetStore');
  if (integration && !uploaded) {
    const provider = integration && getIntegrationProvider(state.integrations, currentBackend(state.config).getToken, integration);
    return provider.upload(fileObj, privateUpload).then(
      response => (
        new AssetProxy(response.asset.url.replace(/^(https?):/, ''), null, true, response.asset)
      ),
      error => new AssetProxy(value, fileObj, false)
    );  
  } else if (privateUpload) {
    throw new Error('The Private Upload option is only avaible for Asset Store Integration');
  }
  
  return Promise.resolve(new AssetProxy(value, fileObj, uploaded));
}
