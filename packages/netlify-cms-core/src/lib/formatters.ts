import { Map } from 'immutable';
import { flow, partialRight, trimEnd, trimStart } from 'lodash';
import { sanitizeSlug } from './urlHelper';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import {
  selectIdentifier,
  selectField,
  COMMIT_AUTHOR,
  COMMIT_DATE,
  selectInferedField,
  getFileFromSlug,
} from '../reducers/collections';
import { Collection, SlugConfig, Config, EntryMap } from '../types/redux';
import { stripIndent } from 'common-tags';
import { FILES } from '../constants/collectionTypes';

const {
  compileStringTemplate,
  parseDateFromEntry,
  SLUG_MISSING_REQUIRED_DATE,
  keyToPathArray,
  addFileTemplateFields,
} = stringTemplate;

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
      case 'author-login':
        return authorLogin || '';
      case 'author-name':
        return authorName || '';
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

export const getProcessSegment = (slugConfig: SlugConfig, ignoreValues: string[] = []) => {
  return (value: string) =>
    ignoreValues.includes(value)
      ? value
      : flow([value => String(value), prepareSlug, partialRight(sanitizeSlug, slugConfig)])(value);
};

export const slugFormatter = (
  collection: Collection,
  entryData: Map<string, unknown>,
  slugConfig: SlugConfig,
) => {
  const slugTemplate = collection.get('slug') || '{{slug}}';

  const identifier = entryData.getIn(keyToPathArray(selectIdentifier(collection) as string));
  if (!identifier) {
    throw new Error(
      'Collection must have a field name that is a valid entry identifier, or must have `identifier_field` set',
    );
  }

  const processSegment = getProcessSegment(slugConfig);
  const date = new Date();
  const slug = compileStringTemplate(slugTemplate, date, identifier, entryData, processSegment);

  if (!collection.has('path')) {
    return slug;
  } else {
    const pathTemplate = prepareSlug(collection.get('path') as string);
    return compileStringTemplate(pathTemplate, date, slug, entryData, (value: string) =>
      value === slug ? value : processSegment(value),
    );
  }
};

export const previewUrlFormatter = (
  baseUrl: string,
  collection: Collection,
  slug: string,
  slugConfig: SlugConfig,
  entry: EntryMap,
) => {
  /**
   * Preview URL can't be created without `baseUrl`. This makes preview URLs
   * optional for backends that don't support them.
   */
  if (!baseUrl) {
    return;
  }

  const basePath = trimEnd(baseUrl, '/');

  const isFileCollection = collection.get('type') === FILES;
  const file = isFileCollection ? getFileFromSlug(collection, entry.get('slug')) : undefined;

  const getPathTemplate = () => {
    return file?.get('preview_path') ?? collection.get('preview_path');
  };
  const getDateField = () => {
    return file?.get('preview_path_date_field') ?? collection.get('preview_path_date_field');
  };

  /**
   * If a `previewPath` is provided for the collection/file, use it to construct the
   * URL path.
   */
  const pathTemplate = getPathTemplate();

  /**
   * Without a `previewPath` for the collection/file (via config), the preview URL
   * will be the URL provided by the backend.
   */
  if (!pathTemplate) {
    return baseUrl;
  }

  let fields = entry.get('data') as Map<string, string>;
  fields = addFileTemplateFields(entry.get('path'), fields, collection.get('folder'));
  const dateFieldName = getDateField() || selectInferedField(collection, 'date');
  const date = parseDateFromEntry((entry as unknown) as Map<string, unknown>, dateFieldName);

  // Prepare and sanitize slug variables only, leave the rest of the
  // `preview_path` template as is.
  const processSegment = getProcessSegment(slugConfig, [fields.get('dirname')]);
  let compiledPath;

  try {
    compiledPath = compileStringTemplate(pathTemplate, date, slug, fields, processSegment);
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
};

export const summaryFormatter = (
  summaryTemplate: string,
  entry: EntryMap,
  collection: Collection,
) => {
  let entryData = entry.get('data');
  const date =
    parseDateFromEntry(
      (entry as unknown) as Map<string, unknown>,
      selectInferedField(collection, 'date'),
    ) || null;
  const identifier = entryData.getIn(keyToPathArray(selectIdentifier(collection) as string));

  entryData = addFileTemplateFields(entry.get('path'), entryData, collection.get('folder'));
  // allow commit information in summary template
  if (entry.get('author') && !selectField(collection, COMMIT_AUTHOR)) {
    entryData = entryData.set(COMMIT_AUTHOR, entry.get('author'));
  }
  if (entry.get('updatedOn') && !selectField(collection, COMMIT_DATE)) {
    entryData = entryData.set(COMMIT_DATE, entry.get('updatedOn'));
  }
  const summary = compileStringTemplate(summaryTemplate, date, identifier, entryData);
  return summary;
};

export const folderFormatter = (
  folderTemplate: string,
  entry: EntryMap | undefined,
  collection: Collection,
  defaultFolder: string,
  folderKey: string,
  slugConfig: SlugConfig,
) => {
  if (!entry || !entry.get('data')) {
    return folderTemplate;
  }

  let fields = (entry.get('data') as Map<string, string>).set(folderKey, defaultFolder);
  fields = addFileTemplateFields(entry.get('path'), fields, collection.get('folder'));

  const date =
    parseDateFromEntry(
      (entry as unknown) as Map<string, unknown>,
      selectInferedField(collection, 'date'),
    ) || null;
  const identifier = fields.getIn(keyToPathArray(selectIdentifier(collection) as string));
  const processSegment = getProcessSegment(slugConfig, [defaultFolder, fields.get('dirname')]);

  const mediaFolder = compileStringTemplate(
    folderTemplate,
    date,
    identifier,
    fields,
    processSegment,
  );

  return mediaFolder;
};
