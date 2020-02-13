import { List } from 'immutable';
import { get, escapeRegExp } from 'lodash';
import consoleError from '../lib/consoleError';
import { CONFIG_SUCCESS } from '../actions/config';
import { FILES, FOLDER } from '../constants/collectionTypes';
import { INFERABLE_FIELDS, IDENTIFIER_FIELDS } from '../constants/fieldInference';
import { formatExtensions } from '../formats/formats';
import {
  CollectionsAction,
  Collection,
  CollectionFiles,
  EntryField,
  State,
  EntryMap,
} from '../types/redux';
import { selectMediaFolder } from './entries';
import { keyToPathArray } from '../lib/stringTemplate';

const collections = (state = null, action: CollectionsAction) => {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const configCollections = action.payload
        ? action.payload.get('collections')
        : List<Collection>();

      return (
        configCollections
          .toOrderedMap()
          .map(item => {
            const collection = item as Collection;
            if (collection.has('folder')) {
              return collection.set('type', FOLDER);
            }
            if (collection.has('files')) {
              return collection.set('type', FILES);
            }
          })
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          .mapKeys((key: string, collection: Collection) => collection.get('name'))
      );
    }
    default:
      return state;
  }
};

const selectors = {
  [FOLDER]: {
    entryExtension(collection: Collection) {
      return (
        collection.get('extension') ||
        get(formatExtensions, collection.get('format') || 'frontmatter')
      ).replace(/^\./, '');
    },
    fields(collection: Collection) {
      return collection.get('fields');
    },
    entryPath(collection: Collection, slug: string) {
      const folder = (collection.get('folder') as string).replace(/\/$/, '');
      return `${folder}/${slug}.${this.entryExtension(collection)}`;
    },
    entrySlug(collection: Collection, path: string) {
      const folder = (collection.get('folder') as string).replace(/\/$/, '');
      const slug = path
        .split(folder + '/')
        .pop()
        ?.replace(new RegExp(`\\.${escapeRegExp(this.entryExtension(collection))}$`), '');

      return slug;
    },
    allowNewEntries(collection: Collection) {
      return collection.get('create');
    },
    allowDeletion(collection: Collection) {
      return collection.get('delete', true);
    },
    templateName(collection: Collection) {
      return collection.get('name');
    },
  },
  [FILES]: {
    fileForEntry(collection: Collection, slug: string) {
      const files = collection.get('files');
      return files && files.filter(f => f?.get('name') === slug).get(0);
    },
    fields(collection: Collection, slug: string) {
      const file = this.fileForEntry(collection, slug);
      return file && file.get('fields');
    },
    entryPath(collection: Collection, slug: string) {
      const file = this.fileForEntry(collection, slug);
      return file && file.get('file');
    },
    entrySlug(collection: Collection, path: string) {
      const file = (collection.get('files') as CollectionFiles)
        .filter(f => f?.get('file') === path)
        .get(0);
      return file && file.get('name');
    },
    entryLabel(collection: Collection, slug: string) {
      const path = this.entryPath(collection, slug);
      const files = collection.get('files');
      return files && files.find(f => f?.get('file') === path).get('label');
    },
    allowNewEntries() {
      return false;
    },
    allowDeletion(collection: Collection) {
      return collection.get('delete', false);
    },
    templateName(_collection: Collection, slug: string) {
      return slug;
    },
  },
};

const getFieldsWithMediaFolders = (fields: EntryField[]) => {
  const fieldsWithMediaFolders = fields.reduce((acc, f) => {
    if (f.has('media_folder')) {
      acc = [...acc, f];
    }

    if (f.has('fields')) {
      const fields = f.get('fields')?.toArray() as EntryField[];
      acc = [...acc, ...getFieldsWithMediaFolders(fields)];
    }
    if (f.has('field')) {
      const field = f.get('field') as EntryField;
      acc = [...acc, ...getFieldsWithMediaFolders([field])];
    }

    return acc;
  }, [] as EntryField[]);

  return fieldsWithMediaFolders;
};

const getFileFromSlug = (collection: Collection, slug: string) => {
  return collection
    .get('files')
    ?.toArray()
    .filter(f => f.get('name') === slug)[0];
};

export const selectFieldsWithMediaFolders = (collection: Collection, slug: string) => {
  if (collection.has('folder')) {
    const fields = collection.get('fields').toArray();
    return getFieldsWithMediaFolders(fields);
  } else if (collection.has('files')) {
    const fields =
      getFileFromSlug(collection, slug)
        ?.get('fields')
        .toArray() || [];
    return getFieldsWithMediaFolders(fields);
  }

  return [];
};

export const selectMediaFolders = (state: State, collection: Collection, entry: EntryMap) => {
  const fields = selectFieldsWithMediaFolders(collection, entry.get('slug'));
  const folders = fields.map(f => selectMediaFolder(state.config, collection, entry, f));
  if (collection.has('files')) {
    const file = getFileFromSlug(collection, entry.get('slug'));
    if (file) {
      folders.unshift(selectMediaFolder(state.config, collection, entry, undefined));
    }
  }
  if (collection.has('media_folder')) {
    // stop evaluating media folders at collection level
    collection = collection.delete('files');
    folders.unshift(selectMediaFolder(state.config, collection, entry, undefined));
  }

  return folders;
};

export const selectFields = (collection: Collection, slug: string) =>
  selectors[collection.get('type')].fields(collection, slug);
export const selectFolderEntryExtension = (collection: Collection) =>
  selectors[FOLDER].entryExtension(collection);
export const selectFileEntryLabel = (collection: Collection, slug: string) =>
  selectors[FILES].entryLabel(collection, slug);
export const selectEntryPath = (collection: Collection, slug: string) =>
  selectors[collection.get('type')].entryPath(collection, slug);
export const selectEntrySlug = (collection: Collection, path: string) =>
  selectors[collection.get('type')].entrySlug(collection, path);
export const selectAllowNewEntries = (collection: Collection) =>
  selectors[collection.get('type')].allowNewEntries(collection);
export const selectAllowDeletion = (collection: Collection) =>
  selectors[collection.get('type')].allowDeletion(collection);
export const selectTemplateName = (collection: Collection, slug: string) =>
  selectors[collection.get('type')].templateName(collection, slug);

export const getFieldsNames = (fields: EntryField[], prefix = '') => {
  let names = fields.map(f => `${prefix}${f.get('name')}`);

  fields.forEach((f, index) => {
    if (f.has('fields')) {
      const fields = f.get('fields')?.toArray() as EntryField[];
      names = [...names, ...getFieldsNames(fields, `${names[index]}.`)];
    }
    if (f.has('field')) {
      const field = f.get('field') as EntryField;
      names = [...names, ...getFieldsNames([field], `${names[index]}.`)];
    }
  });

  return names;
};

export const selectField = (collection: Collection, key: string) => {
  const array = keyToPathArray(key);
  let name: string | undefined;
  let field;
  let fields = collection.get('fields', List<EntryField>()).toArray();
  while ((name = array.shift()) && fields) {
    field = fields.find(f => f.get('name') === name);
    if (field?.has('fields')) {
      fields = field?.get('fields')?.toArray() as EntryField[];
    }
    if (field?.has('field')) {
      fields = [field?.get('field') as EntryField];
    }
  }

  return field;
};

export const selectIdentifier = (collection: Collection) => {
  const identifier = collection.get('identifier_field');
  const identifierFields = identifier ? [identifier, ...IDENTIFIER_FIELDS] : IDENTIFIER_FIELDS;
  const fieldNames = getFieldsNames(collection.get('fields', List<EntryField>()).toArray());
  return identifierFields.find(id =>
    fieldNames.find(name => name?.toLowerCase().trim() === id.toLowerCase().trim()),
  );
};
export const selectInferedField = (collection: Collection, fieldName: string) => {
  if (fieldName === 'title' && collection.get('identifier_field')) {
    return selectIdentifier(collection);
  }
  const inferableField = (INFERABLE_FIELDS as Record<
    string,
    {
      type: string;
      synonyms: string[];
      secondaryTypes: string[];
      fallbackToFirstField: boolean;
      showError: boolean;
    }
  >)[fieldName];
  const fields = collection.get('fields');
  let field;

  // If collection has no fields or fieldName is not defined within inferables list, return null
  if (!fields || !inferableField) return null;
  // Try to return a field of the specified type with one of the synonyms
  const mainTypeFields = fields
    .filter(f => f?.get('widget', 'string') === inferableField.type)
    .map(f => f?.get('name'));
  field = mainTypeFields.filter(f => inferableField.synonyms.indexOf(f as string) !== -1);
  if (field && field.size > 0) return field.first();

  // Try to return a field for each of the specified secondary types
  const secondaryTypeFields = fields
    .filter(f => inferableField.secondaryTypes.indexOf(f?.get('widget', 'string') as string) !== -1)
    .map(f => f?.get('name'));
  field = secondaryTypeFields.filter(f => inferableField.synonyms.indexOf(f as string) !== -1);
  if (field && field.size > 0) return field.first();

  // Try to return the first field of the specified type
  if (inferableField.fallbackToFirstField && mainTypeFields.size > 0) return mainTypeFields.first();

  // Coundn't infer the field. Show error and return null.
  if (inferableField.showError) {
    consoleError(
      `The Field ${fieldName} is missing for the collection “${collection.get('name')}”`,
      `Netlify CMS tries to infer the entry ${fieldName} automatically, but one couldn't be found for entries of the collection “${collection.get(
        'name',
      )}”. Please check your site configuration.`,
    );
  }

  return null;
};

export default collections;
