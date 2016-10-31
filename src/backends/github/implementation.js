import semaphore from 'semaphore';
import AuthenticationPage from './AuthenticationPage';
import API from './API';

const MAX_CONCURRENT_DOWNLOADS = 10;

export default class GitHub {
  constructor(config) {
    this.config = config;
    if (config.getIn(['backend', 'repo']) == null) {
      throw new Error('The GitHub backend needs a "repo" in the backend configuration.');
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

  entriesByFolder(collection) {
    return this.api.listFiles(collection.get('folder'))
    .then(this.fetchFiles);
  }

  entriesByFiles(collection) {
    const files = collection.get('files').map(collectionFile => ({
      path: collectionFile.get('file'),
      label: collectionFile.get('label'),
    }));
    return this.fetchFiles(files);
  }

  fetchFiles = (files) => {
    const sem = semaphore(MAX_CONCURRENT_DOWNLOADS);
    const promises = [];
    files.forEach((file) => {
      promises.push(new Promise((resolve, reject) => (
        sem.take(() => this.api.readFile(file.path, file.sha).then((data) => {
          resolve({ file, data });
          sem.leave();
        }).catch((err) => {
          sem.leave();
          reject(err);
        }))
      )));
    });
    return Promise.all(promises);
  };

  // Fetches a single entry.
  getEntry(collection, slug, path) {
    return this.api.readFile(path).then(data => ({
      file: { path },
      data,
    }));
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
          const slug = branch.ref.split('refs/heads/cms/').pop();
          return sem.take(() => this.api.readUnpublishedBranchFile(slug).then((data) => {
            if (data === null || data === undefined) {
              resolve(null);
              sem.leave();
            } else {
              const path = data.metaData.objects.entry;
              resolve({
                slug,
                file: { path },
                data: data.fileData,
                metaData: data.metaData,
              });
              sem.leave();
            }
          }).catch((err) => {
            sem.leave();
            reject(err);
          }));
        }));
      });
      return Promise.all(promises);
    });
  }

  unpublishedEntry(collection, slug) {
    return this.api.readUnpublishedBranchFile(slug)
    .then(data => ({
      slug,
      file: { path: data.metaData.objects.entry },
      data: data.fileData,
      metaData: data.metaData,
    }));
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.api.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  publishUnpublishedEntry(collection, slug, status) {
    return this.api.publishUnpublishedEntry(collection, slug, status);
  }
}
