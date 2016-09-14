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
    return this.api.listUnpublishedBranches().then((branches) => {
      const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
      const promises = [];
      branches.map((branch) => {
        promises.push(new Promise((resolve, reject) => {
          const contentKey = branch.ref.split('refs/heads/cms/').pop();
          return sem.take(() => this.api.readUnpublishedBranchFile(contentKey).then((data) => {
            const entryPath = data.metaData.objects.entry;
            const entry = createEntry(entryPath, entryPath.split('/').pop().replace(/\.[^\.]+$/, ''), data.file);
            entry.metaData = data.metaData;
            resolve(entry);
            sem.leave();
          }).catch((err) => {
            sem.leave();
            reject(err);
          }));
        }));
      });
      return Promise.all(promises);
    }).then((entries) => {
      return {
        pagination: {},
        entries
      };
    });
  }

  unpublishedEntry(collection, slug) {
    return this.unpublishedEntries().then((response) => (
      response.entries.filter((entry) => (
        entry.metaData && entry.metaData.collection === collection.get('name') && entry.slug === slug
      ))[0]
    ));
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.api.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  publishUnpublishedEntry(collection, slug, status) {
    return this.api.publishUnpublishedEntry(collection, slug, status);
  }
}
