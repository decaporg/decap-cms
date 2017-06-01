import AuthenticationPage from './AuthenticationPage';
import { fileExtension } from '../../lib/pathHelper'

window.repoFiles = window.repoFiles || {};

function getFile(path) {
  const segments = path.split('/');
  let obj = window.repoFiles;
  while (obj && segments.length) {
    obj = obj[segments.shift()];
  }
  return obj || {};
}

function nameFromEmail(email) {
  return email
    .split('@').shift().replace(/[.-_]/g, ' ')
    .split(' ')
    .filter(f => f)
    .map(s => s.substr(0, 1).toUpperCase() + (s.substr(1) || ''))
    .join(' ');
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({ email: state.email, name: nameFromEmail(state.email) });
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    const entries = [];
    const folder = collection.get('folder');
    if (folder) {
      for (const path in window.repoFiles[folder]) {
        if (fileExtension(path) !== extension) {
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

}
