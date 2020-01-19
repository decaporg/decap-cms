import { Map } from 'immutable';
import { flow, partialRight } from 'lodash';
import { sanitizeSlug } from './urlHelper';
import { compileStringTemplate } from './stringTemplate';
import { selectIdentifier } from '../reducers/collections';
import { Collection, SlugConfig, Config } from '../types/redux';

const commitMessageTemplates = Map({
  create: 'Create {{collection}} “{{slug}}”',
  update: 'Update {{collection}} “{{slug}}”',
  delete: 'Delete {{collection}} “{{slug}}”',
  uploadMedia: 'Upload “{{path}}”',
  deleteMedia: 'Delete “{{path}}”',
  openAuthoring: '{{message}}',
});

const variableRegex = /\{\{([^}]+)\}\}/g;

type Options = {
  slug?: string;
  path?: string;
  collection?: Collection;
  authorLogin?: string;
  authorName?: string;
};

export const commitMessageFormatter = (
  type: string,
  config: Config,
  { slug, path, collection, authorLogin, authorName }: Options,
  isOpenAuthoring?: boolean,
) => {
  const templates = commitMessageTemplates.merge(
    config.getIn(['backend', 'commit_messages'], Map<string, string>()),
  );

  const commitMessage = templates.get(type).replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'slug':
        return slug || '';
      case 'path':
        return path || '';
      case 'collection':
        return collection ? collection.get('label_singular') || collection.get('label') : '';
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

export const prepareSlug = (slug: string) => {
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

export const slugFormatter = (
  collection: Collection,
  entryData: Map<string, unknown>,
  slugConfig: SlugConfig,
) => {
  const slugTemplate = collection.get('slug') || '{{slug}}';

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const identifier = entryData.get(selectIdentifier(collection)) as string;
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
    const pathTemplate = collection.get('path') as string;
    return compileStringTemplate(pathTemplate, date, slug, entryData, (value: string) =>
      value === slug ? value : processSegment(value),
    );
  }
};
