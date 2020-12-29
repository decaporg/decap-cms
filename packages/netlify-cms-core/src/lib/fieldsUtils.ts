import { throwIfNotDraft } from './immerUtils';
import { IDENTIFIER_FIELDS, INFERABLE_FIELDS, SORTABLE_FIELDS } from '../constants/fieldInference';
import consoleError from './consoleError';
import { COMMIT_AUTHOR, COMMIT_DATE } from '../constants/commitProps';
import { CmsCollection, CmsField } from '../types/redux';
import { Backend } from '../backend';

export const traverseFields = (
  fields: CmsField[],
  updater: (field: CmsField) => void,
  done = () => false,
) => {
  throwIfNotDraft(fields);

  if (done()) {
    return;
  }

  for (let i = 0, l = fields.length; i < l; i += 1) {
    const field = fields[i];
    updater(field);
    if (field.fields) {
      traverseFields(field.fields, updater, done);
    } else if (field.field) {
      traverseFields([field.field], updater, done);
    } else if (field.types) {
      traverseFields(field.types, updater, done);
    }
  }
};

export const getFieldsNames = (fields: CmsField[], prefix = '') => {
  let names = fields.map(field => `${prefix}${field.name}`);

  fields.forEach((field, index) => {
    if (field.fields) {
      names = [...names, ...getFieldsNames(field.fields, `${names[index]}.`)];
    } else if (field.field) {
      names = [...names, ...getFieldsNames([field.field], `${names[index]}.`)];
    } else if (field.types) {
      names = [...names, ...getFieldsNames(field.types, `${names[index]}.`)];
    }
  });

  return names;
};

export const selectIdentifier = (collection: CmsCollection) => {
  const identifier = collection.identifier_field;
  const identifierFields = identifier ? [identifier, ...IDENTIFIER_FIELDS] : [...IDENTIFIER_FIELDS];
  const fieldNames = getFieldsNames(collection.fields || []);
  return identifierFields.find(id =>
    fieldNames.find(name => name.toLowerCase().trim() === id.toLowerCase().trim()),
  );
};

export const selectInferredField = (
  collection: CmsCollection,
  fieldName: keyof typeof INFERABLE_FIELDS,
) => {
  if (fieldName === 'title' && collection.identifier_field) {
    return selectIdentifier(collection);
  }
  const inferableField = INFERABLE_FIELDS[fieldName];
  const fields = collection.fields;
  let field;

  // If collection has no fields or fieldName is not defined within inferables list, return null
  if (!fields || !inferableField) return null;
  // Try to return a field of the specified type with one of the synonyms
  const mainTypeFields = fields
    .filter(f => (f.widget || 'string') === inferableField.type)
    .map(f => f.name);
  field = mainTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (field && field.length > 0) return field[0];

  // Try to return a field for each of the specified secondary types
  const secondaryTypeFields = fields
    .filter(f => inferableField.secondaryTypes.indexOf(f.widget || 'string') !== -1)
    .map(f => f.name);
  field = secondaryTypeFields.filter(f => inferableField.synonyms.indexOf(f) !== -1);
  if (field && field.length > 0) return field[0];

  // Try to return the first field of the specified type
  if (inferableField.fallbackToFirstField && mainTypeFields.length > 0) return mainTypeFields[0];

  // Coundn't infer the field. Show error and return null.
  if (inferableField.showError) {
    consoleError(
      `The Field ${fieldName} is missing for the collection “${collection.name}”`,
      `Netlify CMS tries to infer the entry ${fieldName} automatically, but one couldn't be found for entries of the collection “${collection.name}”. Please check your site configuration.`,
    );
  }

  return null;
};

export const selectDefaultSortableFields = (collection: CmsCollection, backend: Backend) => {
  let defaultSortable = SORTABLE_FIELDS.map(type => {
    const field = selectInferredField(collection, type);
    if (backend.isGitBackend() && type === 'author' && !field) {
      // default to commit author if not author field is found
      return COMMIT_AUTHOR;
    }
    return field;
  }).filter(Boolean);

  if (backend.isGitBackend()) {
    // always have commit date by default
    defaultSortable = [COMMIT_DATE, ...defaultSortable];
  }

  return defaultSortable as string[];
};
