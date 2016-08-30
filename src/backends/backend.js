import TestRepoBackend from './test-repo/implementation';
import GitHubBackend from './github/implementation';
import { resolveFormat } from '../formats/formats';
import { createEntry } from '../valueObjects/Entry';
import { SIMPLE, BRANCH } from './constants';

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

  newEntry(collection) {
    const newEntry = createEntry();
    return this.entryWithFormat(collection)(newEntry);
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

  slugFormatter(template, entry) {
    var date = new Date();
    return template.replace(/\{\{([^\}]+)\}\}/g, function(_, name) {
      switch (name) {
        case 'year':
          return date.getFullYear();
        case 'month':
          return ('0' + (date.getMonth() + 1)).slice(-2);
        case 'day':
          return ('0' + date.getDate()).slice(-2);
        case 'slug':
          return entry.getIn(['data', 'title']).trim().toLowerCase().replace(/[^a-z0-9\.\-\_]+/gi, '-');
        default:
          return entry.getIn(['data', name]);
      }
    });
  }

  getPublishMode(config) {
    const publish_modes = [SIMPLE, BRANCH];
    const mode = config.getIn(['backend', 'publish_mode']);
    if (publish_modes.indexOf(mode) !== -1) {
      return mode;
    } else {
      return SIMPLE;
    }
  }

  persistEntry(config, collection, entryDraft, MediaFiles) {

    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;
    const entryData = entryDraft.getIn(['entry', 'data']).toJS();
    let entryObj;
    if (newEntry) {
      const slug = this.slugFormatter(collection.get('slug'), entryDraft.get('entry'));
      entryObj = {
        path: `${collection.get('folder')}/${slug}.md`,
        slug: slug,
        raw: this.entryToRaw(collection, entryData)
      };
    } else {
      entryObj = {
        path: entryDraft.getIn(['entry', 'path']),
        slug: entryDraft.getIn(['entry', 'slug']),
        raw: this.entryToRaw(collection, entryData)
      };
    }

    const commitMessage = (newEntry ? 'Created ' : 'Updated ') +
          collection.get('label') + ' “' +
          entryDraft.getIn(['entry', 'data', 'title']) + '”';

    const mode = this.getPublishMode(config);

    const collectionName = collection.get('name');

    return this.implementation.persistEntry(entryObj, MediaFiles, { newEntry, commitMessage, collectionName, mode });
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
