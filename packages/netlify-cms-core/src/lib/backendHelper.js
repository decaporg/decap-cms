import { Map } from 'immutable';
import { flow, partialRight } from 'lodash';
import { sanitizeSlug } from 'Lib/urlHelper';
import { compileStringTemplate } from 'Lib/stringTemplate';
import { selectIdentifier } from 'Reducers/collections';

const commitMessageTemplates = Map({
  create: 'Create {{collection}} “{{slug}}”',
  update: 'Update {{collection}} “{{slug}}”',
  delete: 'Delete {{collection}} “{{slug}}”',
  uploadMedia: 'Upload “{{path}}”',
  deleteMedia: 'Delete “{{path}}”',
  openAuthoring: '{{message}}',
});

const variableRegex = /\{\{([^}]+)\}\}/g;

export const commitMessageFormatter = (
  type,
  config,
  { slug, path, collection, authorLogin, authorName },
  isOpenAuthoring,
) => {
  const templates = commitMessageTemplates.merge(
    config.getIn(['backend', 'commit_messages'], Map()),
  );

  const commitMessage = templates.get(type).replace(variableRegex, (_, variable) => {
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

  if (!isOpenAuthoring) {
    return commitMessage;
  }

  const message = templates.get('openAuthoring').replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'message':
        return commitMessage;
      case 'author-login':
        return authorLogin || '';
      case 'author-name':
        return authorName || '';
      default:
        console.warn(`Ignoring unknown variable “${variable}” in open authoring message template.`);
        return '';
    }
  });

  return message;
};

export const prepareSlug = slug => {
  return (
    slug
      .trim()
      // Convert slug to lower-case
      .toLocaleLowerCase()

      // Remove single quotes.
      .replace(/[']/g, '')

      // Replace periods with dashes.
      .replace(/[.]/g, '-')
  );
};

export const slugFormatter = (collection, entryData, slugConfig) => {
  const slugTemplate = collection.get('slug') || '{{slug}}';

  const identifier = entryData.get(selectIdentifier(collection));
  if (!identifier) {
    throw new Error(
      'Collection must have a field name that is a valid entry identifier, or must have `identifier_field` set',
    );
  }

  const processSegment = flow([
    value => String(value),
    prepareSlug,
    partialRight(sanitizeSlug, slugConfig),
  ]);

  const date = new Date();
  const slug = compileStringTemplate(slugTemplate, date, identifier, entryData, processSegment);

  if (!collection.has('path')) {
    return slug;
  } else {
    const pathTemplate = collection.get('path');
    return compileStringTemplate(pathTemplate, date, slug, entryData, value =>
      value === slug ? value : processSegment(value),
    );
  }
};
