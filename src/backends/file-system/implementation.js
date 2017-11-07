import AuthenticationPage from './AuthenticationPage';
import API from "./API";
import { fileExtension } from '../../lib/pathHelper';

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

export default class fs {
  constructor(config) {
    this.config = config;

    this.api_root = config.getIn(["backend", "api_root"], "http://localhost:8080/api");
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    return this.authenticate(user);
  }

  authenticate(state) {
    this.api = new API({ api_root: this.api_root });
    return Promise.resolve({ email: state.email, name: nameFromEmail(state.email) });
  }

  logout() {
    return null;
  }

  getToken() {
    return Promise.resolve('');
  }

  entriesByFolder(collection, extension) {
    return this.api.listFiles(collection.get("folder"))
    .then(files => files.filter(file => fileExtension(file.name) === extension))
    .then(this.fetchFiles);
  }

  entriesByFiles(collection) {
    const files = collection.get("files").map(collectionFile => ({
      path: collectionFile.get("file"),
      label: collectionFile.get("label"),
    }));
    return this.fetchFiles(files);
  }

  fetchFiles = (files) => {
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => this.api.readFile(file.path).then((data) => {
        resolve({ file, data });
      }).catch((err) => {
        reject(err);
      })));
    });
    return Promise.all(promises);
  };

  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }
}
