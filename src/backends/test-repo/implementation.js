import { remove, attempt, isError } from 'lodash';
import uuid from 'uuid/v4';
import AuthenticationPage from './AuthenticationPage';

window.repoFiles = window.repoFiles || {};

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

  persistEntry(entry, mediaFiles = [], options) {
    const newEntry = options.newEntry || false;
    const folder = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const fileName = entry.path.substring(entry.path.lastIndexOf('/') + 1);
    window.repoFiles[folder] = window.repoFiles[folder] || {};
    window.repoFiles[folder][fileName] = window.repoFiles[folder][fileName] || {};
    if (newEntry) {
      window.repoFiles[folder][fileName] = { content: entry.raw };
    } else {
      window.repoFiles[folder][fileName].content = entry.raw;
    }
    return Promise.resolve();
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
