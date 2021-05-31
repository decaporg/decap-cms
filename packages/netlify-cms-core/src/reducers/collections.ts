import { List, Set, fromJS, OrderedMap } from 'immutable';
import { get, escapeRegExp } from 'lodash';
import { stringTemplate } from 'netlify-cms-lib-widgets';

import consoleError from '../lib/consoleError';
import { CONFIG_SUCCESS } from '../actions/config';
import { FILES, FOLDER } from '../constants/collectionTypes';
import { COMMIT_DATE, COMMIT_AUTHOR } from '../constants/commitProps';
import { INFERABLE_FIELDS, IDENTIFIER_FIELDS, SORTABLE_FIELDS } from '../constants/fieldInference';
import { formatExtensions } from '../formats/formats';
import { selectMediaFolder } from './entries';
import { summaryFormatter } from '../lib/formatters';

import type {
  Collection,
  Collections,
  CollectionFiles,
  EntryField,
  EntryMap,
  ViewFilter,
  ViewGroup,
  CmsConfig,
} from '../types/redux';
import type { ConfigAction } from '../actions/config';
import type { Backend } from '../backend';

const { keyToPathArray } = stringTemplate;

const defaultState: Collections = fromJS({});

function collections(state = defaultState, action: ConfigAction) {
  switch (action.type) {
    case CONFIG_SUCCESS: {
      const collections = action.payload.collections;
      let newState = OrderedMap({});
      collections.forEach(collection => {
        newState = newState.set(collection.name, fromJS(collection));
      });
      return newState;
    }
    default:
      return state;
  }
}

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
      const file = this.fileForEntry(collection, slug);
      return file && file.get('label');
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

function getFieldsWithMediaFolders(fields: EntryField[]) {
  const fieldsWithMediaFolders = fields.reduce((acc, f) => {
    if (f.has('media_folder')) {
      acc = [...acc, f];
    }

    if (f.has('fields')) {
      const fields = f.get('fields')?.toArray() as EntryField[];
      acc = [...acc, ...getFieldsWithMediaFolders(fields)];
    } else if (f.has('field')) {
      const field = f.get('field') as EntryField;
      acc = [...acc, ...getFieldsWithMediaFolders([field])];
    } else if (f.has('types')) {
      const types = f.get('types')?.toArray() as EntryField[];
      acc = [...acc, ...getFieldsWithMediaFolders(types)];
    }

    return acc;
  }, [] as EntryField[]);

  return fieldsWithMediaFolders;
}

export function getFileFromSlug(collection: Collection, slug: string) {
  return collection
    .get('files')
    ?.toArray()
    .find(f => f.get('name') === slug);
}

export function selectFieldsWithMediaFolders(collection: Collection, slug: string) {
  if (collection.has('folder')) {
    const fields = collection.get('fields').toArray();
    return getFieldsWithMediaFolders(fields);
  } else if (collection.has('files')) {
    const fields = getFileFromSlug(collection, slug)?.get('fields').toArray() || [];
    return getFieldsWithMediaFolders(fields);
  }

  return [];
}

export function selectMediaFolders(config: CmsConfig, collection: Collection, entry: EntryMap) {
  const fields = selectFieldsWithMediaFolders(collection, entry.get('slug'));
  const folders = fields.map(f => selectMediaFolder(config, collection, entry, f));
  if (collection.has('files')) {
    const file = getFileFromSlug(collection, entry.get('slug'));
    if (file) {
      folders.unshift(selectMediaFolder(config, collection, entry, undefined));
    }
  }
  if (collection.has('media_folder')) {
    // stop evaluating media folders at collection level
    collection = collection.delete('files');
    folders.unshift(selectMediaFolder(config, collection, entry, undefined));
  }

  return Set(folders).toArray();
}

export function selectFields(collection: Collection, slug: string) {
  return selectors[collection.get('type')].fields(collection, slug);
}

export function selectFolderEntryExtension(collection: Collection) {
  return selectors[FOLDER].entryExtension(collection);
}

export function selectFileEntryLabel(collection: Collection, slug: string) {
  return selectors[FILES].entryLabel(collection, slug);
}

export function selectEntryPath(collection: Collection, slug: string) {
  return selectors[collection.get('type')].entryPath(collection, slug);
}

export function selectEntrySlug(collection: Collection, path: string) {
  return selectors[collection.get('type')].entrySlug(collection, path);
}

export function selectAllowNewEntries(collection: Collection) {
  return selectors[collection.get('type')].allowNewEntries(collection);
}

export function selectAllowDeletion(collection: Collection) {
  return selectors[collection.get('type')].allowDeletion(collection);
}

export function selectTemplateName(collection: Collection, slug: string) {
  return selectors[collection.get('type')].templateName(collection, slug);
}

export function getFieldsNames(fields: EntryField[], prefix = '') {
  let names = fields.map(f => `${prefix}${f.get('name')}`);

  fields.forEach((f, index) => {
    if (f.has('fields')) {
      const fields = f.get('fields')?.toArray() as EntryField[];
      names = [...names, ...getFieldsNames(fields, `${names[index]}.`)];
    } else if (f.has('field')) {
      const field = f.get('field') as EntryField;
      names = [...names, ...getFieldsNames([field], `${names[index]}.`)];
    } else if (f.has('types')) {
      const types = f.get('types')?.toArray() as EntryField[];
      names = [...names, ...getFieldsNames(types, `${names[index]}.`)];
    }
  });

  return names;
}

export function selectField(collection: Collection, key: string) {
  const array = keyToPathArray(key);
  let name: string | undefined;
  let field;
  let fields = collection.get('fields', List<EntryField>()).toArray();
  while ((name = array.shift()) && fields) {
    field = fields.find(f => f.get('name') === name);
    if (field?.has('fields')) {
      fields = field?.get('fields')?.toArray() as EntryField[];
    } else if (field?.has('field')) {
      fields = [field?.get('field') as EntryField];
    } else if (field?.has('types')) {
      fields = field?.get('types')?.toArray() as EntryField[];
    }
  }

  return field;
}

export function traverseFields(
  fields: List<EntryField>,
  updater: (field: EntryField) => EntryField,
  done = () => false,
) {
  if (done()) {
    return fields;
  }

  fields = fields
    .map(f => {
      const field = updater(f as EntryField);
      if (done()) {
        return field;
      } else if (field.has('fields')) {
        return field.set('fields', traverseFields(field.get('fields')!, updater, done));
      } else if (field.has('field')) {
        return field.set(
          'field',
          traverseFields(List([field.get('field')!]), updater, done).get(0),
        );
      } else if (field.has('types')) {
        return field.set('types', traverseFields(field.get('types')!, updater, done));
      } else {
        return field;
      }
    })
    .toList() as List<EntryField>;

  return fields;
}

export function updateFieldByKey(
  collection: Collection,
  key: string,
  updater: (field: EntryField) => EntryField,
) {
  const selected = selectField(collection, key);
  if (!selected) {
    return collection;
  }

  let updated = false;

  function updateAndBreak(f: EntryField) {
    const field = f as EntryField;
    if (field === selected) {
      updated = true;
      return updater(field);
    } else {
      return field;
    }
  }

  collection = collection.set(
    'fields',
    traverseFields(collection.get('fields', List<EntryField>()), updateAndBreak, () => updated),
  );

  return collection;
}

export function selectIdentifier(collection: Collection) {
  const identifier = collection.get('identifier_field');
  const identifierFields = identifier ? [identifier, ...IDENTIFIER_FIELDS] : [...IDENTIFIER_FIELDS];
  const fieldNames = getFieldsNames(collection.get('fields', List()).toArray());
  return identifierFields.find(id =>
    fieldNames.find(name => name.toLowerCase().trim() === id.toLowerCase().trim()),
  );
}

export function selectInferedField(collection: Collection, fieldName: string) {
  if (fieldName === 'title' && collection.get('identifier_field')) {
    return selectIdentifier(collection);
  }
  const inferableField = (
    INFERABLE_FIELDS as Record<
      string,
      {
        type: string;
        synonyms: string[];
        secondaryTypes: string[];
        fallbackToFirstField: boolean;
        showError: boolean;
      }
    >
  )[fieldName];
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
}

export function selectEntryCollectionTitle(collection: Collection, entry: EntryMap) {
  // prefer formatted summary over everything else
  const summaryTemplate = collection.get('summary');
  if (summaryTemplate) return summaryFormatter(summaryTemplate, entry, collection);

  // if the collection is a file collection return the label of the entry
  if (collection.get('type') == FILES) {
    const label = selectFileEntryLabel(collection, entry.get('slug'));
    if (label) return label;
  }

  // try to infer a title field from the entry data
  const entryData = entry.get('data');
  const titleField = selectInferedField(collection, 'title');
  return titleField && entryData.getIn(keyToPathArray(titleField));
}

export function selectDefaultSortableFields(
  collection: Collection,
  backend: Backend,
  hasIntegration: boolean,
) {
  let defaultSortable = SORTABLE_FIELDS.map((type: string) => {
    const field = selectInferedField(collection, type);
    if (backend.isGitBackend() && type === 'author' && !field && !hasIntegration) {
      // default to commit author if not author field is found
      return COMMIT_AUTHOR;
    }
    return field;
  }).filter(Boolean);

  if (backend.isGitBackend() && !hasIntegration) {
    // always have commit date by default
    defaultSortable = [COMMIT_DATE, ...defaultSortable];
  }

  return defaultSortable as string[];
}

export function selectSortableFields(collection: Collection, t: (key: string) => string) {
  const fields = collection
    .get('sortable_fields')
    .toArray()
    .map(key => {
      if (key === COMMIT_DATE) {
        return { key, field: { name: key, label: t('collection.defaultFields.updatedOn.label') } };
      }
      const field = selectField(collection, key);
      if (key === COMMIT_AUTHOR && !field) {
        return { key, field: { name: key, label: t('collection.defaultFields.author.label') } };
      }

      return { key, field: field?.toJS() };
    })
    .filter(item => !!item.field)
    .map(item => ({ ...item.field, key: item.key }));

  return fields;
}

export function selectSortDataPath(collection: Collection, key: string) {
  if (key === COMMIT_DATE) {
    return 'updatedOn';
  } else if (key === COMMIT_AUTHOR && !selectField(collection, key)) {
    return 'author';
  } else {
    return `data.${key}`;
  }
}

export function selectViewFilters(collection: Collection) {
  const viewFilters = collection.get('view_filters').toJS() as ViewFilter[];
  return viewFilters;
}

export function selectViewGroups(collection: Collection) {
  const viewGroups = collection.get('view_groups').toJS() as ViewGroup[];
  return viewGroups;
}

export function selectFieldsComments(collection: Collection, entryMap: EntryMap) {
  let fields: EntryField[] = [];
  if (collection.has('folder')) {
    fields = collection.get('fields').toArray();
  } else if (collection.has('files')) {
    const file = collection.get('files')!.find(f => f?.get('name') === entryMap.get('slug'));
    fields = file.get('fields').toArray();
  }
  const comments: Record<string, string> = {};
  const names = getFieldsNames(fields);
  names.forEach(name => {
    const field = selectField(collection, name);
    if (field?.has('comment')) {
      comments[name] = field.get('comment')!;
    }
  });

  return comments;
}

export function selectHasMetaPath(collection: Collection) {
  return (
    collection.has('folder') &&
    collection.get('type') === FOLDER &&
    collection.has('meta') &&
    collection.get('meta')?.has('path')
  );
}

export default collections;
