import OfflinePage from './OfflinePage';

function getFile(path) {
  return {};
}

export default class Offline {
  constructor(config) {
    this.config = config;
    this.assets = [];
    this.message = config.getIn(["backend", "message"]);
    if (!this.message) {
      this.message = "The CMS app is currently offline.";
    }
  }

  authComponent() {
    return OfflinePage;
  }

  restoreUser(user) {
    throw this.message;
  }

  authenticate(state) {
    throw this.message;
  }

  logout() {
    throw this.message;
  }

  getToken() {
    throw this.message;
  }

  entriesByFolder(collection, extension) {
    throw this.message;
  }

  entriesByFiles(collection) {
    throw this.message;
  }

  getEntry(collection, slug, path) {
    throw this.message;
  }

  persistEntry(entry, mediaFiles = [], options) {
    throw this.message;
  }

  getMedia() {
    throw this.message;
  }

  persistMedia({ fileObj }) {
    throw this.message;
  }

  deleteFile(path, commitMessage) {
    throw this.message;
  }
}
