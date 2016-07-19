import AuthenticationPage from './AuthenticationPage';

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

  entries(collection) {
    const entries = [];
    const folder = collection.get('folder');
    if (folder) {
      for (var path in window.repoFiles[folder]) {
        entries.push({
          path: folder + '/' + path,
          slug: getSlug(path),
          raw: window.repoFiles[folder][path].content
        });
      }
    }

    return Promise.resolve({
      pagination: {},
      entries
    });
  }

  entry(collection, slug) {
    return this.entries(collection).then((response) => (
      response.entries.filter((entry) => entry.slug === slug)[0]
    ));
  }

  persistEntry(collection, entry, mediaFiles = []) {
    const folder = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const fileName = entry.path.substring(entry.path.lastIndexOf('/') + 1);
    window.repoFiles[folder][fileName]['content'] = entry.raw;
    mediaFiles.forEach(media => media.uploaded = true);
    return Promise.resolve();
  }
}
