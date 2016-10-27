import AuthenticationPage from './AuthenticationPage';
import { createEntry } from '../../valueObjects/Entry';

function getSlug(path) {
  const m = path.match(/([^\/]+?)(\.[^\/\.]+)?$/);
  return m && m[1];
}

function getFile(path) {
  const segments = path.split('/');
  let obj = window.repoFiles;
  while (obj && segments.length) {
    obj = obj[segments.shift()];
  }
  return obj;
}

export default class TestRepo {
  constructor(config) {
    this.config = config;
    if (window.repoFiles == null) {
      throw 'The TestRepo backend needs a "window.repoFiles" object.';
    }
  }

  setUser() {}

  authComponent() {
    return AuthenticationPage;
  }

  authenticate(state) {
    return Promise.resolve({ email: state.email });
  }

  entriesByFolder(collection) {
    const entries = [];
    const folder = collection.get('folder');
    if (folder) {
      for (const path in window.repoFiles[folder]) {
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
      data: getFile(path).content
    });
  }

  persistEntry(entry, mediaFiles = [], options) {
    const newEntry = options.newEntry || false;
    const folder = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const fileName = entry.path.substring(entry.path.lastIndexOf('/') + 1);
    if (newEntry) {
      window.repoFiles[folder][fileName] = { content: entry.raw };
    } else {
      window.repoFiles[folder][fileName].content = entry.raw;
    }
    mediaFiles.forEach(media => media.uploaded = true);
    return Promise.resolve();
  }

}
