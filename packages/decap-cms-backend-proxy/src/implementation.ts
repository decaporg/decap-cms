import {
  EditorialWorkflowError,
  APIError,
  unsentRequest,
  blobToFileObj,
} from 'decap-cms-lib-util';

import AuthenticationPage from './AuthenticationPage';

import type {
  Entry,
  AssetProxy,
  PersistOptions,
  User,
  Config,
  Implementation,
  ImplementationFile,
  UnpublishedEntry,
  Note,
} from 'decap-cms-lib-util';

async function serializeAsset(assetProxy: AssetProxy) {
  const base64content = await assetProxy.toBase64!();
  return { path: assetProxy.path, content: base64content, encoding: 'base64' };
}

type MediaFile = {
  id: string;
  content: string;
  encoding: string;
  name: string;
  path: string;
};

function deserializeMediaFile({ id, content, encoding, path, name }: MediaFile) {
  let byteArray = new Uint8Array(0);
  if (encoding !== 'base64') {
    console.error(`Unsupported encoding '${encoding}' for file '${path}'`);
  } else {
    const decodedContent = atob(content);
    byteArray = new Uint8Array(decodedContent.length);
    for (let i = 0; i < decodedContent.length; i++) {
      byteArray[i] = decodedContent.charCodeAt(i);
    }
  }
  const blob = new Blob([byteArray]);
  const file = blobToFileObj(name, blob);
  const url = URL.createObjectURL(file);
  return { id, name, path, file, size: file.size, url, displayURL: url };
}

export default class ProxyBackend implements Implementation {
  proxyUrl: string;
  mediaFolder: string;
  options: { initialWorkflowStatus?: string };
  branch: string;
  cmsLabelPrefix?: string;

  constructor(config: Config, options = {}) {
    if (!config.backend.proxy_url) {
      throw new Error('The Proxy backend needs a "proxy_url" in the backend configuration.');
    }

    this.branch = config.backend.branch || 'master';
    this.proxyUrl = config.backend.proxy_url;
    this.mediaFolder = config.media_folder;
    this.options = options;
    this.cmsLabelPrefix = config.backend.cms_label_prefix;
  }

  isGitBackend() {
    return false;
  }

  status() {
    return Promise.resolve({ auth: { status: true }, api: { status: true, statusPage: '' } });
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser() {
    return this.authenticate();
  }

  authenticate() {
    return Promise.resolve() as unknown as Promise<User>;
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  async request(payload: { action: string; params: Record<string, unknown> }) {
    const response = await unsentRequest.fetchWithTimeout(this.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ branch: this.branch, ...payload }),
    });

    const json = await response.json();

    if (response.ok) {
      return json;
    } else {
      throw new APIError(json.error, response.status, 'Proxy');
    }
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    return this.request({
      action: 'entriesByFolder',
      params: { branch: this.branch, folder, extension, depth },
    });
  }

  entriesByFiles(files: ImplementationFile[]) {
    return this.request({
      action: 'entriesByFiles',
      params: { branch: this.branch, files },
    });
  }

  getEntry(path: string) {
    return this.request({
      action: 'getEntry',
      params: { branch: this.branch, path },
    });
  }

  unpublishedEntries() {
    return this.request({
      action: 'unpublishedEntries',
      params: { branch: this.branch },
    });
  }

  async unpublishedEntry({
    id,
    collection,
    slug,
  }: {
    id?: string;
    collection?: string;
    slug?: string;
  }) {
    try {
      const entry: UnpublishedEntry = await this.request({
        action: 'unpublishedEntry',
        params: { branch: this.branch, id, collection, slug, cmsLabelPrefix: this.cmsLabelPrefix },
      });

      return entry;
    } catch (e) {
      if (e.status === 404) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
      throw e;
    }
  }

  async unpublishedEntryDataFile(collection: string, slug: string, path: string, id: string) {
    const { data } = await this.request({
      action: 'unpublishedEntryDataFile',
      params: { branch: this.branch, collection, slug, path, id },
    });
    return data;
  }

  async unpublishedEntryMediaFile(collection: string, slug: string, path: string, id: string) {
    const file = await this.request({
      action: 'unpublishedEntryMediaFile',
      params: { branch: this.branch, collection, slug, path, id },
    });
    return deserializeMediaFile(file);
  }

  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.request({
      action: 'deleteUnpublishedEntry',
      params: { branch: this.branch, collection, slug },
    });
  }

  async persistEntry(entry: Entry, options: PersistOptions) {
    const assets = await Promise.all(entry.assets.map(serializeAsset));
    return this.request({
      action: 'persistEntry',
      params: {
        branch: this.branch,
        dataFiles: entry.dataFiles,
        assets,
        options: { ...options, status: options.status || this.options.initialWorkflowStatus },
        cmsLabelPrefix: this.cmsLabelPrefix,
      },
    });
  }

  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.request({
      action: 'updateUnpublishedEntryStatus',
      params: {
        branch: this.branch,
        collection,
        slug,
        newStatus,
        cmsLabelPrefix: this.cmsLabelPrefix,
      },
    });
  }

  publishUnpublishedEntry(collection: string, slug: string) {
    return this.request({
      action: 'publishUnpublishedEntry',
      params: { branch: this.branch, collection, slug },
    });
  }

  async getMedia(mediaFolder = this.mediaFolder) {
    const files: MediaFile[] = await this.request({
      action: 'getMedia',
      params: { branch: this.branch, mediaFolder },
    });

    return files.map(deserializeMediaFile);
  }

  async getMediaFile(path: string) {
    const file = await this.request({
      action: 'getMediaFile',
      params: { branch: this.branch, path },
    });
    return deserializeMediaFile(file);
  }

  async persistMedia(assetProxy: AssetProxy, options: PersistOptions) {
    const asset = await serializeAsset(assetProxy);
    const file: MediaFile = await this.request({
      action: 'persistMedia',
      params: { branch: this.branch, asset, options: { commitMessage: options.commitMessage } },
    });

    return deserializeMediaFile(file);
  }

  async getNotes(collection: string, slug: string): Promise<Note[]> {
    try {
      const response = await this.request({
        action: 'getNotes',
        params: {
          branch: this.branch,
          collection,
          slug
        },
      });
      return response.notes || [];
    } catch (error) {
      console.warn('Failed to get notes:', error);
      return [];
    }
  }

  async addNote(collection: string, slug: string, note: Omit<Note, 'id'>): Promise<Note> {
    const response = await this.request({
      action: 'addNote',
      params: {
        branch: this.branch,
        collection,
        slug,
        note
      },
    });
    return response.note;
  }

  async updateNote(collection: string, slug: string, noteId: string, updates: Partial<Note>): Promise<Note> {
    const response = await this.request({
      action: 'updateNote',
      params: {
        branch: this.branch,
        collection,
        slug,
        noteId,
        updates
      },
    });
    return response.note;
  }

  async deleteNote(collection: string, slug: string, noteId: string): Promise<void> {
    await this.request({
      action: 'deleteNote',
      params: {
        branch: this.branch,
        collection,
        slug,
        noteId
      },
    });
  }

  async toggleNoteResolution(collection: string, slug: string, noteId: string): Promise<Note> {
    const response = await this.request({
      action: 'toggleNoteResolution',
      params: {
        branch: this.branch,
        collection,
        slug,
        noteId
      },
    });
    return response.note;
  }

  async getPRMetadata(collection: string, slug: string): Promise<{
    id: string;
    url: string;
    author: string;
    createdAt: string;
  } | null> {
    try {
      const response = await this.request({
        action: 'getPRMetadata',
        params: {
          branch: this.branch,
          collection,
          slug
        },
      });
      return response.metadata || null;
    } catch (error) {
      console.warn('Failed to get PR metadata:', error);
      return null;
    }
  }

  deleteFiles(paths: string[], commitMessage: string) {
    return this.request({
      action: 'deleteFiles',
      params: { branch: this.branch, paths, options: { commitMessage } },
    });
  }

  getDeployPreview(collection: string, slug: string) {
    return this.request({
      action: 'getDeployPreview',
      params: { branch: this.branch, collection, slug },
    });
  }
}
