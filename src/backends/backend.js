import { attempt, flatten, isError } from 'lodash';
import { fromJS, Map } from 'immutable';
import fuzzy from 'fuzzy';
import { resolveFormat } from "Formats/formats";
import { selectIntegration } from 'Reducers/integrations';
import { getIntegrationProvider } from 'Integrations';
import {
  selectListMethod,
  selectEntrySlug,
  selectEntryPath,
  selectAllowNewEntries,
  selectAllowDeletion,
  selectFolderEntryExtension,
  selectInferedField,
} from "Reducers/collections";
import { createEntry } from "ValueObjects/Entry";
import { sanitizeSlug } from "Lib/urlHelper";
import { registerBackend, getBackend } from 'Lib/registry';
import TestRepoBackend from "./test-repo/implementation";
import GitHubBackend from "./github/implementation";
import GitLabBackend from "./gitlab/implementation";
import GitGatewayBackend from "./git-gateway/implementation";
import { CURSOR_COMPATIBILITY_SYMBOL } from '../valueObjects/Cursor';

/**
 * Register internal backends
 */
registerBackend('git-gateway', GitGatewayBackend);
registerBackend('github', GitHubBackend);
registerBackend('gitlab', GitLabBackend);
registerBackend('test-repo', TestRepoBackend);

const extractSearchFields = searchFields => entry => searchFields.reduce((acc, field) => {
  const f = entry.data[field];
  return f ? `${acc} ${f}` : acc;
}, "");

const sortByScore = (a, b) => {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
};

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
  constructor(config, implementation, backendName, authStore = null) {
    this.implementation = implementation;
    this.backendName = backendName;
    this.authStore = authStore;
    this.integrations = config.get('integrations', new Map());
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

  // TODO: rename this - this method contains the post-processing
  // functionality from `listEntries`, separated so that we can re-use
  // it in `traverseCursor`
  processEntries(loadedEntries, collection) {
    const collectionFilter = collection.get('filter');
    const entries = loadedEntries.map(loadedEntry => createEntry(
      collection.get("name"),
      selectEntrySlug(collection, loadedEntry.file.path),
      loadedEntry.file.path,
      { raw: loadedEntry.data || '', label: loadedEntry.file.label }
    ));
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;
    return filteredEntries;
  }

  // Wrap cursors so we can tell which collection the cursor is
  // from. This is done to prevent traverseCursor from requiring a
  // `collection` argument.
  // TODO: remove intermediate layer so backends can handle cursors
  // directly. The backend has all the information required to do this
  // already,
  wrapCollectionCursor(cursor, collection) {
    return {
      ...cursor,
      data: {
        cursorType: "collection",
        collection: collection.toJS(),
        data: cursor.data,
      },
    };
  }

  unwrapCursor(cursor) {
    return {
      unwrappedCursor: {
        ...cursor,
        data: cursor.data.data,
      },
      data: cursor.data,
    };
  }

  listEntries(collection, page=0) {
    const integration = selectIntegration(this.integrations, collection.get('name'), 'listEntries');
    const integrationProvider = integration
      && getIntegrationProvider(this.integrations, this.implementation.getToken, integration);

    if (integrationProvider) {
      return integrationProvider.listEntries(collection, page);
    }

    const listMethod = this.implementation[selectListMethod(collection)];
    const extension = selectFolderEntryExtension(collection);
    return listMethod.call(this.implementation, collection, extension)
      .then(loadedEntries => {
        const cursor = loadedEntries[CURSOR_COMPATIBILITY_SYMBOL]
          ? this.wrapCollectionCursor(loadedEntries[CURSOR_COMPATIBILITY_SYMBOL], collection)
          : null;
        return {
          entries: this.processEntries(loadedEntries, collection),
          cursor,
        };
      });
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection) {
    const response = await this.listEntries(collection);
    const { entries } = response;
    let { cursor } = response;
    while (cursor && cursor.actions.includes("next")) {
      const { entries: newEntries, cursor: newCursor } = await this.traverseCursor(cursor, "next");
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }

  // Perform a simple string search across all collections, search
  // providers, and entries.
  //
  // onCollectionResults is a callback allowing search results to be
  // displayed as they return from each collection, instead of waiting
  // for the entire search to complete.
  //
  // TODO: move search pagination to cursors
  async search(collections, searchTerm, page = 0) {
    const collectionsWithSearchIntegrations = collections.filter(
      collection => selectIntegration(this.integrations, collection, 'search')
    );

    // The following block EITHER selects a collection-specific
    // integration for the first collection in
    // collectionsWithSearchIntegrations OR it selects a global search
    // integration IFF none of the selected collections have a search
    // integration defined. (selectIntegration looks for a global hook
    // if the collection argument is falsy, and [0] of an empty array
    // is undefined, which is falsy.) Only one integration is used to
    // search every collection - if more than one collection has a
    // search integration configured, only one will be used. The
    // collection whose configured integration is used when there are
    // multiple such collections is dependent on the ordering of the
    // collectionsWithSearchIntegrations, which is based on the order
    // of the collections in the config _unless_ the array used has
    // been reordered by any of the functions called on it up to this
    // point. This is very confusing and likely unintended precedence
    // behavior which has implicit behaviors based on implementation
    // details of the browsers and libraries it uses, but is left here
    // for now to preserve the current integrations behavior until we
    // can replace that API completely.
    const integration = selectIntegration(this.integrations, collectionsWithSearchIntegrations[0], 'search');
    if (integration) {
      const provider = getIntegrationProvider(this.integrations, this.implementation.getToken, integration);
      return provider.search(collectionsWithSearchIntegrations, searchTerm, page);
    }

    //
    // Perform a local search by requesting all entries
    //

    // For each collection, load it, search, and call
    // onCollectionResults with its results
    const errors = [];
    const collectionEntriesRequests = collections.map(async collection => {
      // TODO: pass search fields in as an argument
      const searchFields = [
        selectInferedField(collection, 'title'),
        selectInferedField(collection, 'shortTitle'),
        selectInferedField(collection, 'author'),
      ];
      const collectionEntries = await this.listAllEntries(collection);
      return fuzzy.filter(searchTerm, collectionEntries, {
        extract: extractSearchFields(searchFields),
      });
    }).map(p => p.catch(err => errors.push(err)));
    if (errors.length > 0) {
      throw new Error({ message: "Errors ocurred while searching entries locally!", errors });
    }
    const entries = await Promise.all(collectionEntriesRequests).then(arrs => flatten(arrs));
    const hits = entries.filter(({ score }) => score > 5).sort(sortByScore).map(f => f.original);
    return { entries: hits };
  }

  async query(collection, searchFields, searchTerm) {
    const integration = selectIntegration(this.integrations, collection, 'search');
    if (integration) {
      const provider = getIntegrationProvider(this.integrations, this.implementation.getToken, integration);
      return provider.searchBy(searchFields.map(f => `data.${f}`), collection, searchTerm);
    }
    const entries = await this.listAllEntries(collection);
    const hits = fuzzy.filter(searchTerm, entries, { extract: extractSearchFields(searchFields) })
      .filter(entry => entry.score > 5)
      .sort(sortByScore)
      .map(f => f.original);
    return { query: searchTerm, hits };
  }

  // TODO: stop assuming all cursors are for collections
  traverseCursor(cursor, action) {
    const { data, unwrappedCursor } = this.unwrapCursor(cursor);
    const collection = fromJS(data.collection);
    return this.implementation.traverseCursor(unwrappedCursor, action)
      .then(async ({ entries, cursor: newCursor }) => {
        const wrappedNewCursor = this.wrapCollectionCursor(newCursor, collection);
        return {
          entries: this.processEntries(entries, collection),
          cursor: wrappedNewCursor,
        };
      });
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
    return new Backend(config, getBackend(name).init(config), name, authStore);
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
