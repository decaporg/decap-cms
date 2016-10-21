import TestRepoBackend from './test-repo/implementation';
import GitHubBackend from './github/implementation';
import NetlifyGitBackend from './netlify-git/implementation';
import { resolveFormat } from '../formats/formats';
import { createEntry } from '../valueObjects/Entry';
import { FILES, FOLDER } from '../constants/collectionTypes';

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

const slugFormatter = (template, entryData) => {
  const date = new Date();
  return template.replace(/\{\{([^\}]+)\}\}/g, (_, name) => {
    switch (name) {
      case 'year':
        return date.getFullYear();
      case 'month':
        return (`0${ date.getMonth() + 1 }`).slice(-2);
      case 'day':
        return (`0${ date.getDate() }`).slice(-2);
      case 'slug':
        const identifier = entryData.get('title', entryData.get('path'));
        return identifier.trim().toLowerCase().replace(/[^a-z0-9\.\-\_]+/gi, '-');
      default:
        return entryData.get(name);
    }
  });
};

class Backend {
  constructor(implementation, authStore = null) {
    this.implementation = implementation;
    this.authStore = authStore;
    if (this.implementation === null) {
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

  listEntries(collection) {
    const type = collection.get('type');
    if (type === FOLDER) {
      return this.implementation.entriesByFolder(collection)
      .then(loadedEntries => (
        loadedEntries.map(loadedEntry => createEntry(collection.get('name'), loadedEntry.file.path.split('/').pop().replace(/\.[^\.]+$/, ''), loadedEntry.file.path, { raw: loadedEntry.data }))
      ))
      .then(entries => (
        {
          entries: entries.map(this.entryWithFormat(collection)),
        }
      ));
    } else if (type === FILES) {
      const collectionFiles = collection.get('files').map(collectionFile => ({ path: collectionFile.get('file'), label: collectionFile.get('label') }));
      return this.implementation.entriesByFiles(collection, collectionFiles)
      .then(loadedEntries => (
        loadedEntries.map(loadedEntry => createEntry(collection.get('name'), loadedEntry.file.path.split('/').pop().replace(/\.[^\.]+$/, ''), loadedEntry.file.path, { raw: loadedEntry.data, label: loadedEntry.file.label }))
      ))
      .then(entries => (
        {
          entries: entries.map(this.entryWithFormat(collection)),
        }
      ));
    }
    return Promise.reject(`Couldn't process collection type ${ type }`);
  }

  // We have the file path. Fetch and parse the file.
  getEntry(collection, slug, path) {
    return this.implementation.getEntry(collection, slug, path).then(this.entryWithFormat(collection));
  }

  // Will fetch the whole list of files from GitHub and load each file, then looks up for entry.
  // (Files are persisted in local storage - only expensive on the first run for each file).
  lookupEntry(collection, slug) {
    const type = collection.get('type');
    if (type === FOLDER) {
      return this.implementation.entriesByFolder(collection)
      .then(loadedEntries => (
        loadedEntries.map(loadedEntry => createEntry(collection.get('name'), loadedEntry.file.path.split('/').pop().replace(/\.[^\.]+$/, ''), loadedEntry.file.path, { raw: loadedEntry.data }))
      ))
      .then(response => response.filter(entry => entry.slug === slug)[0])
      .then(this.entryWithFormat(collection));
    }
  }

  newEntry(collection) {
    return createEntry(collection.get('name'));
  }

  entryWithFormat(collectionOrEntity) {
    return (entry) => {
      const format = resolveFormat(collectionOrEntity, entry);
      if (entry && entry.raw) {
        entry.data = format && format.fromFile(entry.raw);
        return entry;
      } else {
        return format.fromFile(entry);
      }
    };
  }

  unpublishedEntries(page, perPage) {
    return this.implementation.unpublishedEntries(page, perPage).then((response) => {
      return {
        pagination: response.pagination,
        entries: response.entries.map(this.entryWithFormat('editorialWorkflow')),
      };
    });
  }

  unpublishedEntry(collection, slug) {
    return this.implementation.unpublishedEntry(collection, slug).then(this.entryWithFormat(collection));
  }

  persistEntry(config, collection, entryDraft, MediaFiles, options) {
    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const parsedData = {
      title: entryDraft.getIn(['entry', 'data', 'title'], 'No Title'),
      description: entryDraft.getIn(['entry', 'data', 'description'], 'No Description'),
    };

    const entryData = entryDraft.getIn(['entry', 'data']).toJS();
    let entryObj;
    if (newEntry) {
      const slug = slugFormatter(collection.get('slug'), entryDraft.getIn(['entry', 'data']));
      entryObj = {
        path: `${ collection.get('folder') }/${ slug }.md`,
        slug,
        raw: this.entryToRaw(collection, entryData),
      };
    } else {
      entryObj = {
        path: entryDraft.getIn(['entry', 'path']),
        slug: entryDraft.getIn(['entry', 'slug']),
        raw: this.entryToRaw(collection, entryData),
      };
    }

    const commitMessage = `${ (newEntry ? 'Created ' : 'Updated ') +
          collection.get('label') } “${
          entryDraft.getIn(['entry', 'data', 'title']) }”`;

    const mode = config.get('publish_mode');

    const collectionName = collection.get('name');

    return this.implementation.persistEntry(entryObj, MediaFiles, {
      newEntry, parsedData, commitMessage, collectionName, mode, ...options,
    });
  }

  persistUnpublishedEntry(config, collection, entryDraft, MediaFiles) {
    return this.persistEntry(config, collection, entryDraft, MediaFiles, { unpublished: true });
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.implementation.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  publishUnpublishedEntry(collection, slug, status) {
    return this.implementation.publishUnpublishedEntry(collection, slug, status);
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
      return new Backend(new TestRepoBackend(config, slugFormatter), authStore);
    case 'github':
      return new Backend(new GitHubBackend(config, slugFormatter), authStore);
    case 'netlify-git':
      return new Backend(new NetlifyGitBackend(config, slugFormatter), authStore);
    default:
      throw `Backend not found: ${ name }`;
  }
}

export const currentBackend = (function () {
  let backend = null;

  return (config) => {
    if (backend) { return backend; }
    if (config.get('backend')) {
      return backend = resolveBackend(config);
    }
  };
}());
