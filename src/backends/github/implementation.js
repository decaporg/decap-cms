import semaphore from 'semaphore';
import { createEntry } from '../../valueObjects/Entry';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitHub {
  constructor(config) {
    this.config = config;
    if (config.getIn(['backend', 'repo']) == null) {
      throw 'The GitHub backend needs a "repo" in the backend configuration.';
    }
    this.repo = config.getIn(['backend', 'repo']);
    this.branch = config.getIn(['backend', 'branch']) || 'master';
  }

  authComponent() {
    return AuthenticationPage;
  }

  setUser(user) {
    this.api = new API(user.token, this.repo, this.branch || 'master');
  }

  authenticate(state) {
    this.api = new API(state.token, this.repo, this.branch || 'master');
    return this.api.user().then((user) => {
      user.token = state.token;
      return user;
    });
  }

  entries(collection) {
    return this.api.listFiles(collection.get('folder')).then((files) => {
      const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
      const promises = [];
      files.map((file) => {
        promises.push(new Promise((resolve, reject) => {
          return sem.take(() => this.api.readFile(file.path, file.sha).then((data) => {
            resolve(createEntry(file.path, file.path.split('/').pop().replace(/\.[^\.]+$/, ''), data));
            sem.leave();
          }).catch((err) => {
            sem.leave();
            reject(err);
          }));
        }));
      });
      return Promise.all(promises);
    }).then((entries) => ({
      pagination: {},
      entries
    }));
  }

  entry(collection, slug) {
    return this.entries(collection).then((response) => (
      response.entries.filter((entry) => entry.slug === slug)[0]
    ));
  }

  persistEntry(entry, mediaFiles = [], options = {}) {
    return this.api.persistFiles(entry, mediaFiles, options);
  }

  unpublishedEntries() {
    return Promise.resolve({
      pagination: {},
      entries: []
    });
  }
}
