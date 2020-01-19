import {
  Entry,
  AssetProxy,
  PersistOptions,
  User,
  Config,
  Implementation,
  ImplementationFile,
} from 'netlify-cms-lib-util';
import AuthenticationPage from './AuthenticationPage';

const serializeAsset = async (assetProxy: AssetProxy) => {
  const base64content = await assetProxy.toBase64!();

  return { path: assetProxy.path, content: base64content, encoding: 'base64' };
};

export default class ProxyBackend implements Implementation {
  proxyUrl: string;
  mediaFolder: string;
  options: { initialWorkflowStatus?: string };
  branch: string;

  constructor(config: Config, options = {}) {
    if (!config.backend.proxy_url) {
      throw new Error('The Proxy backend needs a "proxy_url" in the backend configuration.');
    }

    this.branch = config.backend.branch || 'master';
    this.proxyUrl = config.backend.proxy_url;
    this.mediaFolder = config.media_folder;
    this.options = options;
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser() {
    return this.authenticate();
  }

  authenticate() {
    return (Promise.resolve() as unknown) as Promise<User>;
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  request(payload: { action: string; params: Record<string, unknown> }) {
    return fetch(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ branch: this.branch, ...payload }),
    }).then(r => r.json());
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    return this.request({
      action: 'entriesByFolder',
      params: { folder, extension, depth },
    });
  }

  entriesByFiles(files: ImplementationFile[]) {
    return this.request({
      action: 'entriesByFiles',
      params: { files },
    });
  }

  getEntry(path: string) {
    return this.request({
      action: 'getEntry',
      params: { path },
    });
  }

  unpublishedEntries() {
    return this.request({
      action: 'unpublishedEntries',
      params: {},
    });
  }

  unpublishedEntry(collection: string, slug: string) {
    return this.request({
      action: 'unpublishedEntry',
      params: { collection, slug },
    });
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.request({
      action: 'deleteUnpublishedEntry',
      params: { collection, slug },
    });
  }

  async persistEntry(entry: Entry, assetProxies: AssetProxy[], options: PersistOptions) {
    const assets = await Promise.all(assetProxies.map(serializeAsset));
    return this.request({
      action: 'persistEntry',
      params: {
        entry,
        assets,
        options: { ...options, status: options.status || this.options.initialWorkflowStatus },
      },
    });
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.request({
      action: 'updateUnpublishedEntryStatus',
      params: { collection, slug, newStatus },
    });
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    return this.request({
      action: 'publishUnpublishedEntry',
      params: { collection, slug },
    });
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return this.request({
      action: 'getMedia',
      params: { mediaFolder },
    });
  }

  getMediaFile(path: string) {
    return this.request({
      action: 'getMediaFile',
      params: { path },
    });
  }

  async persistMedia(assetProxy: AssetProxy, options: PersistOptions) {
    const asset = await serializeAsset(assetProxy);
    return this.request({
      action: 'persistMedia',
      params: { asset, options: { commitMessage: options.commitMessage } },
    });
  }

  deleteFile(path: string, commitMessage: string) {
    return this.request({
      action: 'deleteFile',
      params: { path, options: { commitMessage } },
    });
  }

  getDeployPreview(collection: string, slug: string) {
    return this.request({
      action: 'getDeployPreview',
      params: { collection, slug },
    });
  }
}
