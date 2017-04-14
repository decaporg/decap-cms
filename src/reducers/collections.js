import { OrderedMap, fromJS } from 'immutable';
import { has } from 'lodash';
import consoleError from '../lib/consoleError';
import { CONFIG_SUCCESS } from '../actions/config';
import { FILES, FOLDER } from '../constants/collectionTypes';
import { INFERABLE_FIELDS } from '../constants/fieldInference';

const collections = (state = null, action) => {
  const configCollections = action.payload && action.payload.collections;
  switch (action.type) {
    case CONFIG_SUCCESS:
      return OrderedMap().withMutations((map) => {
        (configCollections || []).forEach((configCollection) => {
          if (has(configCollection, 'folder')) {
            configCollection.type = FOLDER; // eslint-disable-line no-param-reassign
          } else if (has(configCollection, 'files')) {
            configCollection.type = FILES; // eslint-disable-line no-param-reassign
          } else {
            throw new Error('Unknown collection type. Collections can be either Folder based or File based. Please verify your site configuration');
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
export const selectFolderEntryExtension = (collection) => selectors[FOLDER].entryExtension(collection);
export const selectEntryPath = (collection, slug) => selectors[collection.get('type')].entryPath(collection, slug);
export const selectEntrySlug = (collection, path) => selectors[collection.get('type')].entrySlug(collection, path);
export const selectListMethod = collection => selectors[collection.get('type')].listMethod();
export const selectAllowNewEntries = collection => selectors[collection.get('type')].allowNewEntries(collection);
export const selectTemplateName = (collection, slug) => selectors[collection.get('type')].templateName(collection, slug);
export const selectInferedField = (collection, fieldName) => {
  const inferableField = INFERABLE_FIELDS[fieldName];
  const fields = collection.get('fields');
  let field;

  // If colllection has no fields or fieldName is not defined within inferables list, return null
  if (!fields || !inferableField) return null;
  // Try to return a field of the specified type with one of the synonyms
  const mainTypeFields = fields.filter(f => f.get('widget', 'string') === inferableField.type).map(f => f.get('name'));
  field = mainTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (field && field.size > 0) return field.first();

  // Try to return a field for each of the specified secondary types
  const secondaryTypeFields = fields.filter(f => inferableField.secondaryTypes.indexOf(f.get('widget', 'string')) !== -1).map(f => f.get('name'));
  field = secondaryTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (field && field.size > 0) return field.first();

  // Try to return the first field of the specified type
  if (inferableField.fallbackToFirstField && mainTypeFields.size > 0) return mainTypeFields.first();

  // Coundn't infer the field. Show error and return null.
  if (inferableField.showError) {
    consoleError(
      `The Field ${ fieldName } is missing for the collection “${ collection.get('name') }”`,
      `Netlify CMS tries to infer the entry ${ fieldName } automatically, but one couldn\'t be found for entries of the collection “${ collection.get('name') }”. Please check your site configuration.`
    );
  }

  return null;
};

export default collections;
