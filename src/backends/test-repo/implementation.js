import AuthenticationPage from './AuthenticationPage';
import { createEntry } from '../../valueObjects/Entry';

function getSlug(path) {
  const m = path.match(/([^\/]+?)(\.[^\/\.]+)?$/);
  return m && m[1];
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

  entriesByFiles(collection, files) {
    throw new Error('Not implemented yet');
  }

  lookupEntry(collection, slug) {
    return this.entries(collection).then(response => (
      response.entries.filter(entry => entry.slug === slug)[0]
    ));
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
