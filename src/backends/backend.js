import TestRepoBackend from './test-repo/implementation';
import GitHubBackend from './github/implementation';
import { resolveFormat } from '../formats/formats';

class LocalStorageAuthStore {
  storageKey = 'nf-cms-user';

  retrieve() {
    const data = window.localStorage.getItem(this.storageKey);
    return data && JSON.parse(data);
  }

  store(userData) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }
}

class Backend {
  constructor(implementation, authStore = null) {
    this.implementation = implementation;
    this.authStore = authStore;
    if (this.implementation == null) {
      throw 'Cannot instantiate a Backend with no implementation';
    }
  }

  currentUser() {
    if (this.user) { return this.user; }
    const stored = this.authStore && this.authStore.retrieve();
    if (stored) {
      this.implementation.setUser(stored);
      return stored;
    }
  }

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials) {
    return this.implementation.authenticate(credentials).then((user) => {
      if (this.authStore) { this.authStore.store(user); }
      return user;
    });
  }

  entries(collection, page, perPage) {
    return this.implementation.entries(collection, page, perPage).then((response) => {
      return {
        pagination: response.pagination,
        entries: response.entries.map(this.entryWithFormat(collection))
      };
    });
  }

  entry(collection, slug) {
    return this.implementation.entry(collection, slug).then(this.entryWithFormat(collection));
  }

  entryWithFormat(collection) {
    return (entry) => {
      const format = resolveFormat(collection, entry);
      if (entry && entry.raw) {
        entry.data = format && format.fromFile(entry.raw);
      }
      return entry;
    };
  }

  persistEntry(collection, entryDraft, MediaFiles) {
    const entryData = entryDraft.getIn(['entry', 'data']).toObject();
    const entryObj = {
      path: entryDraft.getIn(['entry', 'path']),
      slug: entryDraft.getIn(['entry', 'slug']),
      raw: this.entryToRaw(collection, entryData)
    };

    const commitMessage = (entryDraft.getIn(['entry', 'newRecord']) ? 'Created ' : 'Updated ') +
          collection.get('label') + ' “' +
          entryDraft.getIn(['entry', 'data', 'title']) + '”';

    return this.implementation.persistEntry(collection, entryObj, MediaFiles, { commitMessage });
  }

  entryToRaw(collection, entry) {
    const format = resolveFormat(collection, entry);
    return format && format.toFile(entry);
  }
}

export function resolveBackend(config) {
  const name = config.getIn(['backend', 'name']);
  if (name == null) {
    throw 'No backend defined in configuration';
  }

  const authStore = new LocalStorageAuthStore();

  switch (name) {
    case 'test-repo':
      return new Backend(new TestRepoBackend(config), authStore);
    case 'github':
      return new Backend(new GitHubBackend(config), authStore);
    default:
      throw `Backend not found: ${name}`;
  }
}

export const currentBackend = (function() {
  let backend = null;

  return (config) => {
    if (backend) { return backend; }
    if (config.get('backend')) {
      return backend = resolveBackend(config);
    }
  };
})();
