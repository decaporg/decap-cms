import { resolvePath } from '../lib/pathHelper';
import { currentBackend } from "../backends/backend";
import { getIntegrationProvider } from '../integrations';
import { selectIntegration } from '../reducers';

let store;
export const setStore = (storeObj) => {
  store = storeObj;
};

export default function AssetProxy(value, fileObj, uploaded = false, opts = {}) {
  const config = store.getState().config;
  const mediaFolder = opts.mediaFolder || config.get('media_folder');
  const publicFolder = opts.publicFolder || config.get('public_folder');
  this.value = value;
  this.fileObj = fileObj;
  this.uploaded = uploaded;
  this.sha = null;
  this.path = mediaFolder && !uploaded ? resolvePath(value, mediaFolder) : value;
  this.public_path = !uploaded ? resolvePath(value, publicFolder) : value;
}

AssetProxy.prototype.toString = function () {
  if (this.uploaded) return this.public_path;
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

export function createAssetProxy(value, fileObj, uploaded = false, opts = {}) {
  const state = store.getState();
  const privateUpload = opts.isPrivate || false;
  const assetProxyOpts = {
    mediaFolder: opts.mediaFolder,
    publicFolder: opts.publicFolder
  };
  const integration = selectIntegration(state, null, 'assetStore');
  if (integration && !uploaded) {
    const provider = integration && getIntegrationProvider(state.integrations, currentBackend(state.config).getToken, integration);
    return provider.upload(fileObj, privateUpload).then(
      response => (
        new AssetProxy(response.assetURL.replace(/^(https?):/, ''), null, true, assetProxyOpts)
      ),
      error => new AssetProxy(value, fileObj, false, assetProxyOpts)
    );
  } else if (privateUpload) {
    throw new Error('The Private Upload option is only avaible for Asset Store Integration');
  }

  return Promise.resolve(new AssetProxy(value, fileObj, uploaded, assetProxyOpts));
}
