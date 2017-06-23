import { attempt, isError } from 'lodash';
import TestRepoBackend from "./test-repo/implementation";
import GitHubBackend from "./github/implementation";
import NetlifyAuthBackend from "./netlify-auth/implementation";
import { resolveFormat } from "../formats/formats";
import { selectListMethod, selectEntrySlug, selectEntryPath, selectAllowNewEntries, selectFolderEntryExtension } from "../reducers/collections";
import { createEntry } from "../valueObjects/Entry";
import slug from 'slug';

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

const slugFormatter = (template = "{{slug}}", entryData) => {
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
  
  return template.replace(/\{\{([^\}]+)\}\}/g, (_, field) => {
    switch (field) {
      case "year":
        return date.getFullYear();
      case "month":
        return (`0${ date.getMonth() + 1 }`).slice(-2);
      case "day":
        return (`0${ date.getDate() }`).slice(-2);
      case "slug":
        return slug(getIdentifier(entryData).trim(), {lower: true});
      default:
        return slug(entryData.get(field, "").trim(), {lower: true});
    }
  });
};

class Backend {
  constructor(implementation, authStore = null) {
    this.implementation = implementation;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error("Cannot instantiate a Backend with no implementation");
    }
  }

  currentUser() {
    if (this.user) { return this.user; }
    const stored = this.authStore && this.authStore.retrieve();
    if (stored) {
      return Promise.resolve(this.implementation.setUser(stored)).then(() => stored);
    }
    return Promise.resolve(null);
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

  logout() {
    if (this.authStore) {
      this.authStore.logout();
    } else {
      throw new Error("User isn't authenticated.");
    }
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

  entryWithFormat(collectionOrEntity) {
    return (entry) => {
      const format = resolveFormat(collectionOrEntity, entry);
      if (entry && entry.raw !== undefined) {
        const data = (format && attempt(format.fromFile.bind(null, entry.raw))) || {};
        if (isError(data)) console.error(data);
        return Object.assign(entry, { data: isError(data) ? {} : data });
      }
      return format.fromFile(entry);
    };
  }

  unpublishedEntries(page, perPage) {
    return this.implementation.unpublishedEntries(page, perPage)
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
      entries: entries.map(this.entryWithFormat("editorialWorkflow")),
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

  persistEntry(config, collection, entryDraft, MediaFiles, options) {
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
      const slug = slugFormatter(collection.get("slug"), entryDraft.getIn(["entry", "data"]));
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

  switch (name) {
    case "test-repo":
      return new Backend(new TestRepoBackend(config), authStore);
    case "github":
      return new Backend(new GitHubBackend(config), authStore);
    case "netlify-auth":
      return new Backend(new NetlifyAuthBackend(config), authStore);
    default:
      throw new Error(`Backend not found: ${ name }`);
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
