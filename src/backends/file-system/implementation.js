import GoTrue from "gotrue-js";
import jwtDecode from 'jwt-decode';
import {List} from 'immutable';
import trimStart from 'lodash/trimStart';
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

const localHosts = {
  localhost: true,
  "127.0.0.1": true,
  "0.0.0.0": true
};

export default class fs {
  constructor(config) {
    this.config = config;

    this.api_root = config.getIn(["backend", "api_root"], "/api");

    const APIUrl = config.getIn(["backend", "identity_url"], "/.netlify/identity");
    this.authClient = window.netlifyIdentity ? window.netlifyIdentity.gotrue : new GoTrue({APIUrl});

    AuthenticationPage.authClient = this.authClient;
  }

  authComponent() {
    return AuthenticationPage;
  }

  restoreUser(user) {
    if (!localHosts[document.location.host.split(":").shift()]) {
      user = this.authClient && this.authClient.currentUser();
      if (!user) return Promise.reject();
    }
    return this.authenticate(user);
  }

  authenticate(user) {
    if (localHosts[document.location.host.split(":").shift()]) {
      const userData = { name: '', email: '' };
      if (user.email) {
        userData.name = nameFromEmail(user.email);
        userData.email = user.email;
      }
      this.api = new API({
        api_root: this.api_root,
        token: null,
      });
      return Promise.resolve(userData);
    } else {
      this.tokenPromise = user.jwt.bind(user);
      return this.tokenPromise()
      .then((token) => {
        const userData = {
          name: user.user_metadata.name || nameFromEmail(user.email),
          email: user.email,
          avatar_url: user.user_metadata.avatar_url,
          metadata: user.user_metadata,
        };
        this.api = new API({
          api_root: this.api_root,
          token: token,
        });
        return userData;
      });
    }
  }

  logout() {
    if (localHosts[document.location.host.split(":").shift()]) {
      return null;
    } else {
      const user = this.authClient.currentUser();
      return user && user.logout();
    }
  }

  getToken() {
    if (localHosts[document.location.host.split(":").shift()]) {
      return Promise.resolve('');
    } else {
      return this.tokenPromise();
    }
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

  getMedia() {
    return this.api.listFiles(this.config.get('media_folder'))
      .then(files => files.filter(file => file.type === 'file'))
      .then(files => files.map(({ sha, name, size, stats, path }) => {
        return { id: sha, name, size: stats.size, url: `${ this.config.get('public_folder') }/${ name }`, path };
      }));
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  async persistMedia(mediaFile, options = {}) {
    try {
      const response = await this.api.persistFiles([], [mediaFile], options);
      const { value, size, path, public_path, fileObj } = mediaFile;
      const url = public_path;
      return { id: response.sha, name: value, size: fileObj.size, url, path: trimStart(path, '/') };
    }
    catch(error) {
      console.error(error);
      throw error;
    }
  }

  deleteFile(path, commitMessage, options) {
    return this.api.deleteFile(path, commitMessage, options);
  }
}
