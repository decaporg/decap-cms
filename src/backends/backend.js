import { attempt, isError } from 'lodash';
import { resolveFormat } from "Formats/formats";
import { selectIntegration } from 'Reducers/integrations';
import {
  selectListMethod,
  selectEntrySlug,
  selectEntryPath,
  selectAllowNewEntries,
  selectAllowDeletion,
  selectFolderEntryExtension
} from "Reducers/collections";
import { createEntry } from "ValueObjects/Entry";
import { sanitizeSlug } from "Lib/urlHelper";
import TestRepoBackend from "./test-repo/implementation";
import GitHubBackend from "./github/implementation";
import GitGatewayBackend from "./git-gateway/implementation";
import { registerBackend, getBackend } from 'Lib/registry';

/**
 * Register internal backends
 */
registerBackend('git-gateway', GitGatewayBackend);
registerBackend('github', GitHubBackend);
registerBackend('test-repo', TestRepoBackend);


class LocalStorageAuthStore {
  storageKey = "netlify-cms-user";

  retrieve() {
    const data = window.localStorage.getItem(this.storageKey);
    return data && JSON.parse(data);
  }

  store(userData) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }

  logout() {
    window.localStorage.removeItem(this.storageKey);
  }
}

const slugFormatter = (template = "{{slug}}", entryData, slugConfig) => {
  const date = new Date();

  const getIdentifier = (entryData) => {
    const validIdentifierFields = ["title", "path"];
    const identifiers = validIdentifierFields.map((field) =>
      entryData.find((_, key) => key.toLowerCase().trim() === field)
    );

    const identifier = identifiers.find(ident => ident !== undefined);

    if (identifier === undefined) {
      throw new Error("Collection must have a field name that is a valid entry identifier");
    }

    return identifier;
  };

  const slug = template.replace(/\{\{([^\}]+)\}\}/g, (_, field) => {
    switch (field) {
      case "year":
        return date.getFullYear();
      case "month":
        return (`0${ date.getMonth() + 1 }`).slice(-2);
      case "day":
        return (`0${ date.getDate() }`).slice(-2);
      case "hour":
        return (`0${ date.getHours() }`).slice(-2);
      case "minute":
        return (`0${ date.getMinutes() }`).slice(-2);
      case "second":
        return (`0${ date.getSeconds() }`).slice(-2);
      case "slug":
        return getIdentifier(entryData).trim();
      default:
        return entryData.get(field, "").trim();
    }
  })
  // Convert slug to lower-case
  .toLocaleLowerCase()

  // Replace periods with dashes.
  .replace(/[.]/g, '-');

  return sanitizeSlug(slug, slugConfig);
};

class Backend {
  constructor(implementation, backendName, authStore = null) {
    this.implementation = implementation;
    this.backendName = backendName;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error("Cannot instantiate a Backend with no implementation");
    }
  }

  currentUser() {
    if (this.user) { return this.user; }
    const stored = this.authStore && this.authStore.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then((user) => {
        const newUser = {...user, backendName: this.backendName};
        // return confirmed/rehydrated user object instead of stored
        this.authStore.store(newUser);
        return newUser;
      });
    }
    return Promise.resolve(null);
  }

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials) {
    return this.implementation.authenticate(credentials).then((user) => {
      const newUser = {...user, backendName: this.backendName};
      if (this.authStore) { this.authStore.store(newUser); }
      return newUser;
    });
  }

  logout() {
    return Promise.resolve(this.implementation.logout()).then(() => {
      if (this.authStore) {
        this.authStore.logout();
      }
    });
  }

  getToken = () => this.implementation.getToken();

  listEntries(collection) {
    const listMethod = this.implementation[selectListMethod(collection)];
    const extension = selectFolderEntryExtension(collection);
    const collectionFilter = collection.get('filter');
    return listMethod.call(this.implementation, collection, extension)
      .then(loadedEntries => (
        loadedEntries.map(loadedEntry => createEntry(
          collection.get("name"),
          selectEntrySlug(collection, loadedEntry.file.path),
          loadedEntry.file.path,
          { raw: loadedEntry.data || '', label: loadedEntry.file.label }
        ))
      ))
      .then(entries => (
        {
          entries: entries.map(this.entryWithFormat(collection)),
        }
      ))
      // If this collection has a "filter" property, filter entries accordingly
      .then(loadedCollection => (
        {
          entries: collectionFilter ? this.filterEntries(loadedCollection, collectionFilter) : loadedCollection.entries
        }
      ));
  }

  getEntry(collection, slug) {
    return this.implementation.getEntry(collection, slug, selectEntryPath(collection, slug))
      .then(loadedEntry => this.entryWithFormat(collection, slug)(createEntry(
        collection.get("name"),
        slug,
        loadedEntry.file.path,
        { raw: loadedEntry.data, label: loadedEntry.file.label }
      ))
    );
  }

  getMedia() {
    return this.implementation.getMedia();
  }

  entryWithFormat(collectionOrEntity) {
    return (entry) => {
      const format = resolveFormat(collectionOrEntity, entry);
      if (entry && entry.raw !== undefined) {
        const data = (format && attempt(format.fromFile.bind(format, entry.raw))) || {};
        if (isError(data)) console.error(data);
        return Object.assign(entry, { data: isError(data) ? {} : data });
      }
      return format.fromFile(entry);
    };
  }

  unpublishedEntries(collections) {
    return this.implementation.unpublishedEntries()
    .then(loadedEntries => loadedEntries.filter(entry => entry !== null))
    .then(entries => (
      entries.map((loadedEntry) => {
        const entry = createEntry(
          loadedEntry.metaData.collection,
          loadedEntry.slug,
          loadedEntry.file.path,
          {
            raw: loadedEntry.data,
            isModification: loadedEntry.isModification,
          }
        );
        entry.metaData = loadedEntry.metaData;
        return entry;
      })
    ))
    .then(entries => ({
      pagination: 0,
      entries: entries.reduce((acc, entry) => {
        const collection = collections.get(entry.collection);
        if (collection) {
          acc.push(this.entryWithFormat(collection)(entry));
        }
        return acc;
      }, []),
    }));
  }

  unpublishedEntry(collection, slug) {
    return this.implementation.unpublishedEntry(collection, slug)
    .then((loadedEntry) => {
      const entry = createEntry(
        "draft",
        loadedEntry.slug,
        loadedEntry.file.path,
        {
          raw: loadedEntry.data,
          isModification: loadedEntry.isModification,
        });
      entry.metaData = loadedEntry.metaData;
      return entry;
    })
    .then(this.entryWithFormat(collection, slug));
  }

  persistEntry(config, collection, entryDraft, MediaFiles, integrations, options = {}) {
    const newEntry = entryDraft.getIn(["entry", "newRecord"]) || false;

    const parsedData = {
      title: entryDraft.getIn(["entry", "data", "title"], "No Title"),
      description: entryDraft.getIn(["entry", "data", "description"], "No Description!"),
    };

    const entryData = entryDraft.getIn(["entry", "data"]).toJS();
    let entryObj;
    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw (new Error("Not allowed to create new entries in this collection"));
      }
      const slug = slugFormatter(collection.get("slug"), entryDraft.getIn(["entry", "data"]), config.get("slug"));
      const path = selectEntryPath(collection, slug);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get("entry")),
      };
    } else {
      const path = entryDraft.getIn(["entry", "path"]);
      const slug = entryDraft.getIn(["entry", "slug"]);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get("entry")),
      };
    }

    const commitMessage = `${ (newEntry ? "Create " : "Update ") +
          collection.get("label") } “${ entryObj.slug }”`;

    const mode = config.get("publish_mode");

    const collectionName = collection.get("name");

    /**
     * Determine whether an asset store integration is in use.
     */
    const hasAssetStore = integrations && !!selectIntegration(integrations, null, 'assetStore');
    const updatedOptions = { ...options, hasAssetStore };
    const opts = { newEntry, parsedData, commitMessage, collectionName, mode, ...updatedOptions };

    return this.implementation.persistEntry(entryObj, MediaFiles, opts)
      .then(() => entryObj.slug);
  }

  persistMedia(file) {
    const options = {
      commitMessage: `Upload ${file.path}`,
    };
    return this.implementation.persistMedia(file, options);
  }

  deleteEntry(config, collection, slug) {
    const path = selectEntryPath(collection, slug);

    if (!selectAllowDeletion(collection)) {
      throw (new Error("Not allowed to delete entries in this collection"));
    }

    const commitMessage = `Delete ${ collection.get('label') } “${ slug }”`;
    return this.implementation.deleteFile(path, commitMessage);
  }

  deleteMedia(path) {
    const commitMessage = `Delete ${path}`;
    return this.implementation.deleteFile(path, commitMessage);
  }

  persistUnpublishedEntry(...args) {
    return this.persistEntry(...args, { unpublished: true });
  }

  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.implementation.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }

  publishUnpublishedEntry(collection, slug) {
    return this.implementation.publishUnpublishedEntry(collection, slug);
  }

  deleteUnpublishedEntry(collection, slug) {
    return this.implementation.deleteUnpublishedEntry(collection, slug);
  }

  entryToRaw(collection, entry) {
    const format = resolveFormat(collection, entry.toJS());
    const fieldsOrder = this.fieldsOrder(collection, entry);
    return format && format.toFile(entry.get("data").toJS(), fieldsOrder);
  }

  fieldsOrder(collection, entry) {
    const fields = collection.get('fields');
    if (fields) {
      return collection.get('fields').map(f => f.get('name')).toArray();
    }

    const files = collection.get('files');
    const file = (files || []).filter(f => f.get("name") === entry.get("slug")).get(0);
    if (file == null) {
      throw new Error(`No file found for ${ entry.get("slug") } in ${ collection.get('name') }`);
    }
    return file.get('fields').map(f => f.get('name')).toArray();
  }

  filterEntries(collection, filterRule) {
    return collection.entries.filter(entry => (
      entry.data[filterRule.get('field')] === filterRule.get('value')
    ));
  }
}

export function resolveBackend(config) {
  const name = config.getIn(["backend", "name"]);
  if (name == null) {
    throw new Error("No backend defined in configuration");
  }

  const authStore = new LocalStorageAuthStore();

  if (!getBackend(name)) {
    throw new Error(`Backend not found: ${ name }`);
  } else {
    return new Backend(getBackend(name).init(config), name, authStore);
  }
}

export const currentBackend = (function () {
  let backend = null;

  return (config) => {
    if (backend) { return backend; }
    if (config.get("backend")) {
      return backend = resolveBackend(config);
    }
  };
}());
