import { OrderedMap, List, fromJS } from 'immutable';
import { CONFIG_SUCCESS } from '../actions/config';
import { FILES, FOLDER } from '../constants/collectionTypes';

const hasProperty = (config, property) => ({}.hasOwnProperty.call(config, property));

const collections = (state = null, action) => {
  switch (action.type) {
    case CONFIG_SUCCESS:
      const configCollections = action.payload && action.payload.collections;
      return OrderedMap().withMutations((map) => {
        (configCollections || []).forEach((configCollection) => {
          if (hasProperty(configCollection, 'folder')) {
            configCollection.type = FOLDER; // eslint-disable-line no-param-reassign
          } else if (hasProperty(configCollection, 'files')) {
            configCollection.type = FILES; // eslint-disable-line no-param-reassign
          } else {
            throw ('Unknown collection type. Collections can be either Folder based or File based. Please verify your site configuration');
          }
          map.set(configCollection.name, fromJS(configCollection));
        });
      });
    default:
      return state;
  }
};

const formatToExtension = format => ({
  markdown: 'md',
  yaml: 'yml',
  json: 'json',
  html: 'html',
}[format]);

const inferables = {
  title: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['title', 'name', 'label', 'headline'],
  },
  description: {
    type: 'string',
    secondaryTypes: ['markdown'],
    synonyms: ['shortDescription', 'short_description', 'shortdescription', 'description', 'brief', 'body', 'content'],
  },
  image: {
    type: 'image',
    secondaryTypes: ['string'],
    synonyms: ['image', 'thumbnail', 'thumb', 'picture', 'avatar'],
  },
};

const selectors = {
  [FOLDER]: {
    entryExtension(collection) {
      return collection.get('extension') || formatToExtension(collection.get('format') || 'markdown');
    },
    fields(collection) {
      return collection.get('fields');
    },
    entryPath(collection, slug) {
      return `${ collection.get('folder') }/${ slug }.${ this.entryExtension(collection) }`;
    },
    entrySlug(collection, path) {
      return path.split('/').pop().replace(/\.[^\.]+$/, '');
    },
    listMethod() {
      return 'entriesByFolder';
    },
    allowNewEntries(collection) {
      return collection.get('create');
    },
    templateName(collection) {
      return collection.get('name');
    },
  },
  [FILES]: {
    fileForEntry(collection, slug) {
      const files = collection.get('files');
      return files.filter(f => f.get('name') === slug).get(0);
    },
    fields(collection, slug) {
      const file = this.fileForEntry(collection, slug);
      return file && file.get('fields');
    },
    entryPath(collection, slug) {
      const file = this.fileForEntry(collection, slug);
      return file && file.get('file');
    },
    entrySlug(collection, path) {
      const file = collection.get('files').filter(f => f.get('file') === path).get(0);
      return file && file.get('name');
    },
    listMethod() {
      return 'entriesByFiles';
    },
    allowNewEntries() {
      return false;
    },
    templateName(collection, slug) {
      return slug;
    },
  },
};

export const selectFields = (collection, slug) => selectors[collection.get('type')].fields(collection, slug);
export const selectEntryPath = (collection, slug) => selectors[collection.get('type')].entryPath(collection, slug);
export const selectEntrySlug = (collection, path) => selectors[collection.get('type')].entrySlug(collection, path);
export const selectListMethod = collection => selectors[collection.get('type')].listMethod();
export const selectAllowNewEntries = collection => selectors[collection.get('type')].allowNewEntries(collection);
export const selectTemplateName = (collection, slug) => selectors[collection.get('type')].templateName(collection, slug);
export const selectInferedField = (collection, fieldName) => {
  const inferableField = inferables[fieldName];
  let key;

  // If fieldName is not defined within inferables list, return null
  if (!inferableField) return null;

  const fields = collection.get('fields', List());

  // Try to return a field of the specified type with one of the synonyms
  const mainTypeFields = fields.filter(f => f.get('widget') === inferableField.type).map(f => f.get('name'));
  key = mainTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (key) return key;

  // Try to return a field for each of the specified secondary types
  const secondaryTypeFields = fields.filter(f => inferableField.secondaryTypes.indexOf(f.get('widget')) !== -1).map(f => f.get('name'));
  key = secondaryTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (key) return key;

  // Try to return the first field of the specified type
  if (mainTypeFields.size > 0) return mainTypeFields.first();

  return null;
};

export default collections;
