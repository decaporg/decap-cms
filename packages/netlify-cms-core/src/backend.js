import { attempt, flatten, isError, trimStart, trimEnd, flow, partialRight } from 'lodash';
import { Map } from 'immutable';
import { stripIndent } from 'common-tags';
import moment from 'moment';
import fuzzy from 'fuzzy';
import { resolveFormat } from 'Formats/formats';
import { selectIntegration } from 'Reducers/integrations';
import {
  selectListMethod,
  selectEntrySlug,
  selectEntryPath,
  selectAllowNewEntries,
  selectAllowDeletion,
  selectFolderEntryExtension,
  selectIdentifier,
  selectInferedField,
} from 'Reducers/collections';
import { createEntry } from 'ValueObjects/Entry';
import { sanitizeSlug } from 'Lib/urlHelper';
import { getBackend } from 'Lib/registry';
import { Cursor, CURSOR_COMPATIBILITY_SYMBOL } from 'netlify-cms-lib-util';
import { EDITORIAL_WORKFLOW, status } from 'Constants/publishModes';

class LocalStorageAuthStore {
  storageKey = 'netlify-cms-user';

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

function prepareSlug(slug) {
  return (
    slug
      // Convert slug to lower-case
      .toLocaleLowerCase()

      // Remove single quotes.
      .replace(/[']/g, '')

      // Replace periods with dashes.
      .replace(/[.]/g, '-')
  );
}

const dateParsers = {
  year: date => date.getFullYear(),
  month: date => `0${date.getMonth() + 1}`.slice(-2),
  day: date => `0${date.getDate()}`.slice(-2),
  hour: date => `0${date.getHours()}`.slice(-2),
  minute: date => `0${date.getMinutes()}`.slice(-2),
  second: date => `0${date.getSeconds()}`.slice(-2),
};

const SLUG_MISSING_REQUIRED_DATE = 'SLUG_MISSING_REQUIRED_DATE';
const USE_FIELD_PREFIX = 'fields.';

// Allow `fields.` prefix in placeholder to override built in replacements
// like "slug" and "year" with values from fields of the same name.
function getExplicitFieldReplacement(key, data) {
  if (!key.startsWith(USE_FIELD_PREFIX)) {
    return;
  }
  const fieldName = key.substring(USE_FIELD_PREFIX.length);
  return data.get(fieldName, '').trim();
}

function compileSlug(template, date, identifier = '', data = Map(), processor) {
  let missingRequiredDate;

  const slug = template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    let replacement;
    const explicitFieldReplacement = getExplicitFieldReplacement(key, data);

    if (explicitFieldReplacement) {
      replacement = explicitFieldReplacement;
    } else if (dateParsers[key] && !date) {
      missingRequiredDate = true;
      return '';
    } else if (dateParsers[key]) {
      replacement = dateParsers[key](date);
    } else if (key === 'slug') {
      replacement = identifier.trim();
    } else {
      replacement = data.get(key, '').trim();
    }

    if (processor) {
      return processor(replacement);
    }

    return replacement;
  });

  if (missingRequiredDate) {
    const err = new Error();
    err.name = SLUG_MISSING_REQUIRED_DATE;
    throw err;
  } else {
    return slug;
  }
}

function slugFormatter(collection, entryData, slugConfig) {
  const template = collection.get('slug') || '{{slug}}';

  const identifier = entryData.get(selectIdentifier(collection));
  if (!identifier) {
    throw new Error(
      'Collection must have a field name that is a valid entry identifier, or must have `identifier_field` set',
    );
  }

  // Pass entire slug through `prepareSlug` and `sanitizeSlug`.
  // TODO: only pass slug replacements through sanitizers, static portions of
  // the slug template should not be sanitized. (breaking change)
  const processSlug = flow([compileSlug, prepareSlug, partialRight(sanitizeSlug, slugConfig)]);

  return processSlug(template, new Date(), identifier, entryData);
}

const commitMessageTemplates = Map({
  create: 'Create {{collection}} “{{slug}}”',
  update: 'Update {{collection}} “{{slug}}”',
  delete: 'Delete {{collection}} “{{slug}}”',
  uploadMedia: 'Upload “{{path}}”',
  deleteMedia: 'Delete “{{path}}”',
});

const commitMessageFormatter = (type, config, { slug, path, collection }) => {
  const templates = commitMessageTemplates.merge(
    config.getIn(['backend', 'commit_messages'], Map()),
  );
  const messageTemplate = templates.get(type);
  return messageTemplate.replace(/\{\{([^}]+)\}\}/g, (_, variable) => {
    switch (variable) {
      case 'slug':
        return slug;
      case 'path':
        return path;
      case 'collection':
        return collection.get('label_singular') || collection.get('label');
      default:
        console.warn(`Ignoring unknown variable “${variable}” in commit message template.`);
        return '';
    }
  });
};

const extractSearchFields = searchFields => entry =>
  searchFields.reduce((acc, field) => {
    const f = entry.data[field];
    return f ? `${acc} ${f}` : acc;
  }, '');

const sortByScore = (a, b) => {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
};

function parsePreviewPathDate(collection, entry) {
  const dateField =
    collection.get('preview_path_date_field') || selectInferedField(collection, 'date');
  if (!dateField) {
    return;
  }

  const dateValue = entry.getIn(['data', dateField]);
  const dateMoment = dateValue && moment(dateValue);
  if (dateMoment && dateMoment.isValid()) {
    return dateMoment.toDate();
  }
}

function createPreviewUrl(baseUrl, collection, slug, slugConfig, entry) {
  /**
   * Preview URL can't be created without `baseUrl`. This makes preview URLs
   * optional for backends that don't support them.
   */
  if (!baseUrl) {
    return;
  }

  /**
   * Without a `previewPath` for the collection (via config), the preview URL
   * will be the URL provided by the backend.
   */
  if (!collection.get('preview_path')) {
    return baseUrl;
  }

  /**
   * If a `previewPath` is provided for the collection, use it to construct the
   * URL path.
   */
  const basePath = trimEnd(baseUrl, '/');
  const pathTemplate = collection.get('preview_path');
  const fields = entry.get('data');
  const date = parsePreviewPathDate(collection, entry);

  // Prepare and sanitize slug variables only, leave the rest of the
  // `preview_path` template as is.
  const processSegment = flow([
    value => String(value),
    prepareSlug,
    partialRight(sanitizeSlug, slugConfig),
  ]);
  let compiledPath;

  try {
    compiledPath = compileSlug(pathTemplate, date, slug, fields, processSegment);
  } catch (err) {
    // Print an error and ignore `preview_path` if both:
    //   1. Date is invalid (according to Moment), and
    //   2. A date expression (eg. `{{year}}`) is used in `preview_path`
    if (err.name === SLUG_MISSING_REQUIRED_DATE) {
      console.error(stripIndent`
        Collection "${collection.get('name')}" configuration error:
          \`preview_path_date_field\` must be a field with a valid date. Ignoring \`preview_path\`.
      `);
      return basePath;
    }
    throw err;
  }

  const previewPath = trimStart(compiledPath, ' /');
  return `${basePath}/${previewPath}`;
}

class Backend {
  constructor(implementation, { backendName, authStore = null, config } = {}) {
    this.config = config;
    this.implementation = implementation.init(config, {
      useWorkflow: config.getIn(['publish_mode']) === EDITORIAL_WORKFLOW,
      updateUserCredentials: this.updateUserCredentials,
      initialWorkflowStatus: status.first(),
    });
    this.backendName = backendName;
    this.authStore = authStore;
    if (this.implementation === null) {
      throw new Error('Cannot instantiate a Backend with no implementation');
    }
  }

  currentUser() {
    if (this.user) {
      return this.user;
    }
    const stored = this.authStore && this.authStore.retrieve();
    if (stored && stored.backendName === this.backendName) {
      return Promise.resolve(this.implementation.restoreUser(stored)).then(user => {
        const newUser = { ...user, backendName: this.backendName };
        // return confirmed/rehydrated user object instead of stored
        this.authStore.store(newUser);
        return newUser;
      });
    }
    return Promise.resolve(null);
  }

  updateUserCredentials = updatedCredentials => {
    const storedUser = this.authStore && this.authStore.retrieve();
    if (storedUser && storedUser.backendName === this.backendName) {
      const newUser = { ...storedUser, ...updatedCredentials };
      this.authStore.store(newUser);
      return newUser;
    }
  };

  authComponent() {
    return this.implementation.authComponent();
  }

  authenticate(credentials) {
    return this.implementation.authenticate(credentials).then(user => {
      const newUser = { ...user, backendName: this.backendName };
      if (this.authStore) {
        this.authStore.store(newUser);
      }
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

  processEntries(loadedEntries, collection) {
    const collectionFilter = collection.get('filter');
    const entries = loadedEntries.map(loadedEntry =>
      createEntry(
        collection.get('name'),
        selectEntrySlug(collection, loadedEntry.file.path),
        loadedEntry.file.path,
        { raw: loadedEntry.data || '', label: loadedEntry.file.label },
        loadedEntry.updated,
      ),
    );
    const formattedEntries = entries.map(this.entryWithFormat(collection));
    // If this collection has a "filter" property, filter entries accordingly
    const filteredEntries = collectionFilter
      ? this.filterEntries({ entries: formattedEntries }, collectionFilter)
      : formattedEntries;
    return filteredEntries;
  }

  listEntries(collection) {
    const listMethod = this.implementation[selectListMethod(collection)];
    const extension = selectFolderEntryExtension(collection);
    return listMethod.call(this.implementation, collection, extension).then(loadedEntries => ({
      entries: this.processEntries(loadedEntries, collection),
      /*
          Wrap cursors so we can tell which collection the cursor is
          from. This is done to prevent traverseCursor from requiring a
          `collection` argument.
        */
      cursor: Cursor.create(loadedEntries[CURSOR_COMPATIBILITY_SYMBOL]).wrapData({
        cursorType: 'collectionEntries',
        collection,
      }),
    }));
  }

  // The same as listEntries, except that if a cursor with the "next"
  // action available is returned, it calls "next" on the cursor and
  // repeats the process. Once there is no available "next" action, it
  // returns all the collected entries. Used to retrieve all entries
  // for local searches and queries.
  async listAllEntries(collection) {
    if (collection.get('folder') && this.implementation.allEntriesByFolder) {
      const extension = selectFolderEntryExtension(collection);
      return this.implementation
        .allEntriesByFolder(collection, extension)
        .then(entries => this.processEntries(entries, collection));
    }

    const response = await this.listEntries(collection);
    const { entries } = response;
    let { cursor } = response;
    while (cursor && cursor.actions.includes('next')) {
      const { entries: newEntries, cursor: newCursor } = await this.traverseCursor(cursor, 'next');
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries;
  }

  async search(collections, searchTerm) {
    // Perform a local search by requesting all entries. For each
    // collection, load it, search, and call onCollectionResults with
    // its results.
    const errors = [];
    const collectionEntriesRequests = collections
      .map(async collection => {
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
      })
      .map(p => p.catch(err => errors.push(err) && []));

    const entries = await Promise.all(collectionEntriesRequests).then(arrs => flatten(arrs));

    if (errors.length > 0) {
      throw new Error({ message: 'Errors ocurred while searching entries locally!', errors });
    }
    const hits = entries
      .filter(({ score }) => score > 5)
      .sort(sortByScore)
      .map(f => f.original);
    return { entries: hits };
  }

  async query(collection, searchFields, searchTerm) {
    const entries = await this.listAllEntries(collection);
    const hits = fuzzy
      .filter(searchTerm, entries, { extract: extractSearchFields(searchFields) })
      .filter(entry => entry.score > 5)
      .sort(sortByScore)
      .map(f => f.original);
    return { query: searchTerm, hits };
  }

  traverseCursor(cursor, action) {
    const [data, unwrappedCursor] = cursor.unwrapData();
    // TODO: stop assuming all cursors are for collections
    const collection = data.get('collection');
    return this.implementation
      .traverseCursor(unwrappedCursor, action)
      .then(async ({ entries, cursor: newCursor }) => ({
        entries: this.processEntries(entries, collection),
        cursor: Cursor.create(newCursor).wrapData({
          cursorType: 'collectionEntries',
          collection,
        }),
      }));
  }

  getEntry(collection, slug) {
    const path = selectEntryPath(collection, slug);
    const files = collection.get('files');
    const label = files && files.find(f => f.get('file') === path).get('label');
    return this.implementation.getEntry(collection, slug, path).then(loadedEntry =>
      this.entryWithFormat(collection, slug)(
        createEntry(collection.get('name'), slug, loadedEntry.file.path, {
          raw: loadedEntry.data,
          label,
        }),
      ),
    );
  }

  getMedia() {
    return this.implementation.getMedia();
  }

  entryWithFormat(collectionOrEntity) {
    return entry => {
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
    return this.implementation
      .unpublishedEntries()
      .then(loadedEntries => loadedEntries.filter(entry => entry !== null))
      .then(entries =>
        entries.map(loadedEntry => {
          const entry = createEntry(
            loadedEntry.metaData.collection,
            loadedEntry.slug,
            loadedEntry.file.path,
            {
              raw: loadedEntry.data,
              isModification: loadedEntry.isModification,
            },
          );
          entry.metaData = loadedEntry.metaData;
          return entry;
        }),
      )
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
    return this.implementation
      .unpublishedEntry(collection, slug)
      .then(loadedEntry => {
        const entry = createEntry('draft', loadedEntry.slug, loadedEntry.file.path, {
          raw: loadedEntry.data,
          isModification: loadedEntry.isModification,
        });
        entry.metaData = loadedEntry.metaData;
        return entry;
      })
      .then(this.entryWithFormat(collection, slug));
  }

  /**
   * Creates a URL using `site_url` from the config and `preview_path` from the
   * entry's collection. Does not currently make a request through the backend,
   * but likely will in the future.
   */
  getDeploy(collection, slug, entry) {
    /**
     * If `site_url` is undefiend or `show_preview_links` in the config is set to false, do nothing.
     */

    const baseUrl = this.config.get('site_url');

    if (!baseUrl || this.config.get('show_preview_links') === false) {
      return;
    }

    return {
      url: createPreviewUrl(baseUrl, collection, slug, this.config.get('slug'), entry),
      status: 'SUCCESS',
    };
  }

  /**
   * Requests a base URL from the backend for previewing a specific entry.
   * Supports polling via `maxAttempts` and `interval` options, as there is
   * often a delay before a preview URL is available.
   */
  async getDeployPreview(collection, slug, entry, { maxAttempts = 1, interval = 5000 } = {}) {
    /**
     * If the registered backend does not provide a `getDeployPreview` method, or
     * `show_preview_links` in the config is set to false, do nothing.
     */
    if (!this.implementation.getDeployPreview || this.config.get('show_preview_links') === false) {
      return;
    }

    /**
     * Poll for the deploy preview URL (defaults to 1 attempt, so no polling by
     * default).
     */
    let deployPreview,
      count = 0;
    while (!deployPreview && count < maxAttempts) {
      count++;
      deployPreview = await this.implementation.getDeployPreview(collection, slug);
      if (!deployPreview) {
        await new Promise(resolve => setTimeout(() => resolve(), interval));
      }
    }

    /**
     * If there's no deploy preview, do nothing.
     */
    if (!deployPreview) {
      return;
    }

    return {
      /**
       * Create a URL using the collection `preview_path`, if provided.
       */
      url: createPreviewUrl(deployPreview.url, collection, slug, this.config.get('slug'), entry),
      /**
       * Always capitalize the status for consistency.
       */
      status: deployPreview.status ? deployPreview.status.toUpperCase() : '',
    };
  }

  persistEntry(config, collection, entryDraft, MediaFiles, integrations, options = {}) {
    const newEntry = entryDraft.getIn(['entry', 'newRecord']) || false;

    const parsedData = {
      title: entryDraft.getIn(['entry', 'data', 'title'], 'No Title'),
      description: entryDraft.getIn(['entry', 'data', 'description'], 'No Description!'),
    };

    let entryObj;
    if (newEntry) {
      if (!selectAllowNewEntries(collection)) {
        throw new Error('Not allowed to create new entries in this collection');
      }
      const slug = slugFormatter(
        collection,
        entryDraft.getIn(['entry', 'data']),
        config.get('slug'),
      );
      const path = selectEntryPath(collection, slug);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };
    } else {
      const path = entryDraft.getIn(['entry', 'path']);
      const slug = entryDraft.getIn(['entry', 'slug']);
      entryObj = {
        path,
        slug,
        raw: this.entryToRaw(collection, entryDraft.get('entry')),
      };
    }

    const commitMessage = commitMessageFormatter(newEntry ? 'create' : 'update', config, {
      collection,
      slug: entryObj.slug,
      path: entryObj.path,
    });

    const useWorkflow = config.getIn(['publish_mode']) === EDITORIAL_WORKFLOW;

    const collectionName = collection.get('name');

    /**
     * Determine whether an asset store integration is in use.
     */
    const hasAssetStore = integrations && !!selectIntegration(integrations, null, 'assetStore');
    const updatedOptions = { ...options, hasAssetStore };
    const opts = {
      newEntry,
      parsedData,
      commitMessage,
      collectionName,
      useWorkflow,
      ...updatedOptions,
    };

    return this.implementation.persistEntry(entryObj, MediaFiles, opts).then(() => entryObj.slug);
  }

  persistMedia(config, file) {
    const options = {
      commitMessage: commitMessageFormatter('uploadMedia', config, { path: file.path }),
    };
    return this.implementation.persistMedia(file, options);
  }

  deleteEntry(config, collection, slug) {
    const path = selectEntryPath(collection, slug);

    if (!selectAllowDeletion(collection)) {
      throw new Error('Not allowed to delete entries in this collection');
    }

    const commitMessage = commitMessageFormatter('delete', config, { collection, slug, path });
    return this.implementation.deleteFile(path, commitMessage, { collection, slug });
  }

  deleteMedia(config, path) {
    const commitMessage = commitMessageFormatter('deleteMedia', config, { path });
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
    return format && format.toFile(entry.get('data').toJS(), fieldsOrder);
  }

  fieldsOrder(collection, entry) {
    const fields = collection.get('fields');
    if (fields) {
      return collection
        .get('fields')
        .map(f => f.get('name'))
        .toArray();
    }

    const files = collection.get('files');
    const file = (files || []).filter(f => f.get('name') === entry.get('slug')).get(0);
    if (file == null) {
      throw new Error(`No file found for ${entry.get('slug')} in ${collection.get('name')}`);
    }
    return file
      .get('fields')
      .map(f => f.get('name'))
      .toArray();
  }

  filterEntries(collection, filterRule) {
    return collection.entries.filter(entry => {
      const fieldValue = entry.data[filterRule.get('field')];
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(filterRule.get('value'));
      }
      return fieldValue === filterRule.get('value');
    });
  }
}

export function resolveBackend(config) {
  const name = config.getIn(['backend', 'name']);
  if (name == null) {
    throw new Error('No backend defined in configuration');
  }

  const authStore = new LocalStorageAuthStore();

  if (!getBackend(name)) {
    throw new Error(`Backend not found: ${name}`);
  } else {
    return new Backend(getBackend(name), { backendName: name, authStore, config });
  }
}

export const currentBackend = (function() {
  let backend = null;

  return config => {
    if (backend) {
      return backend;
    }
    if (config.get('backend')) {
      return (backend = resolveBackend(config));
    }
  };
})();
