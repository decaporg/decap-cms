import { remove, attempt, isError } from 'lodash';
import uuid from 'uuid/v4';
import { EDITORIAL_WORKFLOW, status } from 'Constants/publishModes';
import { EditorialWorkflowError } from 'ValueObjects/errors';
import AuthenticationPage from './AuthenticationPage';

window.repoFiles = window.repoFiles || {};
window.repoFilesUnpublished = window.repoFilesUnpublished || [];

function getFile(path) {
  const segments = path.split('/');
  let obj = window.repoFiles;
  while (obj && segments.length) {
    obj = obj[segments.shift()];
  }
  return obj || {};
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
    this.assets = [];
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  authenticate() {
    return Promise.resolve();
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    const entries = [];
    const folder = collection.get('folder');
    if (folder) {
      for (const path in window.repoFiles[folder]) {
        if (!path.endsWith('.' + extension)) {
          continue;
        }

        const file = { path: `${ folder }/${ path }` };
        entries.push(
          {
            file,
            data: window.repoFiles[folder][path].content,
          }
        );
      }
    }
    return Promise.resolve(entries);
  }

  entriesByFiles(collection) {
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return Promise.all(files.map(file => ({
      file,
      data: getFile(file.path).content,
    })));
  }

  getEntry(collection, slug, path) {
    return Promise.resolve({
      file: { path },
      data: getFile(path).content,
    });
  }

  unpublishedEntries() {
    return Promise.resolve(window.repoFilesUnpublished);
  }

  unpublishedEntry(collection, slug) {
    const entry = window.repoFilesUnpublished.find(e => (
      e.metaData.collection === collection.get('name') && e.slug === slug
    ));
    if (!entry) {
      return Promise.reject(new EditorialWorkflowError('content is not under editorial workflow', true));
    }
    return Promise.resolve(entry);
  }

  deleteUnpublishedEntry(collection, slug) {
    const unpubStore = window.repoFilesUnpublished;
    const existingEntryIndex = unpubStore.findIndex(e => (
      e.metaData.collection === collection && e.slug === slug
    ));
    unpubStore.splice(existingEntryIndex, 1);
    return Promise.resolve()
  }

  persistEntry({ path, raw, slug }, mediaFiles = [], options = {}) {
    if (options.mode === EDITORIAL_WORKFLOW) {
      const unpubStore = window.repoFilesUnpublished;
      const existingEntryIndex = unpubStore.findIndex(e => e.file.path === path);
      if (existingEntryIndex >= 0) {
        const unpubEntry = { ...unpubStore[existingEntryIndex], data: raw };
        unpubEntry.title = options.parsedData && options.parsedData.title;
        unpubEntry.description = options.parsedData && options.parsedData.description;
        unpubStore.splice(existingEntryIndex, 1, unpubEntry);
      } else {
        const unpubEntry = {
          data: raw,
          file: {
            path,
          },
          metaData: {
            collection: options.collectionName,
            status: status.first(),
            title: options.parsedData && options.parsedData.title,
            description: options.parsedData && options.parsedData.description,
          },
          slug,
        };
        unpubStore.push(unpubEntry);
      }
      return Promise.resolve();
    }

    const newEntry = options.newEntry || false;
    const folder = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    window.repoFiles[folder] = window.repoFiles[folder] || {};
    window.repoFiles[folder][fileName] = window.repoFiles[folder][fileName] || {};
    if (newEntry) {
      window.repoFiles[folder][fileName] = { content: raw };
    } else {
      window.repoFiles[folder][fileName].content = raw;
    }
    return Promise.resolve();
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    const unpubStore = window.repoFilesUnpublished;
    const entryIndex = unpubStore.findIndex(e => (
      e.metaData.collection === collection && e.slug === slug
    ));
    unpubStore[entryIndex].metaData.status = newStatus;
    return Promise.resolve();
  }

  publishUnpublishedEntry(collection, slug) {
    const unpubStore = window.repoFilesUnpublished;
    const unpubEntryIndex = unpubStore.findIndex(e => (
      e.metaData.collection === collection && e.slug === slug
    ));
    const unpubEntry = unpubStore[unpubEntryIndex];
    const entry = { raw: unpubEntry.data, slug: unpubEntry.slug, path: unpubEntry.file.path };
    unpubStore.splice(unpubEntryIndex, 1);
    return this.persistEntry(entry);
  }
  getMedia() {
    return Promise.resolve(this.assets);
  }

  persistMedia({ fileObj }) {
    const { name, size } = fileObj;
    const objectUrl = attempt(window.URL.createObjectURL, fileObj);
    const url = isError(objectUrl) ? '' : objectUrl;
    const normalizedAsset = { id: uuid(), name, size, path: url, url };

    this.assets.push(normalizedAsset);
    return Promise.resolve(normalizedAsset);
  }

  deleteFile(path, commitMessage) {
    const assetIndex = this.assets.findIndex(asset => asset.path === path);
    if (assetIndex > -1) {
      this.assets.splice(assetIndex, 1);
    }

    else {
      const folder = path.substring(0, path.lastIndexOf('/'));
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      delete window.repoFiles[folder][fileName];
    }

    return Promise.resolve();
  }
}
