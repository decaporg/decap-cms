import { Map } from 'immutable';
import { flow, partialRight, trimEnd, trimStart } from 'lodash';
import { sanitizeSlug } from './urlHelper';
import {
  compileStringTemplate,
  parseDateFromEntry,
  SLUG_MISSING_REQUIRED_DATE,
  keyToPathArray,
} from './stringTemplate';
import { selectIdentifier } from '../reducers/collections';
import { Collection, SlugConfig, Config, EntryMap } from '../types/redux';
import { stripIndent } from 'common-tags';
import { basename, fileExtension } from 'netlify-cms-lib-util';

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

const getProcessSegment = (slugConfig: SlugConfig) =>
  flow([value => String(value), prepareSlug, partialRight(sanitizeSlug, slugConfig)]);

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
    const pathTemplate = collection.get('path') as string;
    return compileStringTemplate(pathTemplate, date, slug, entryData, (value: string) =>
      value === slug ? value : processSegment(value),
    );
  }
};

const addFileTemplateFields = (entryPath: string, fields: Map<string, string>) => {
  if (!entryPath) {
    return fields;
  }

  const extension = fileExtension(entryPath);
  const filename = basename(entryPath, `.${extension}`);
  fields = fields.withMutations(map => {
    map.set('filename', filename);
    map.set('extension', extension);
  });

  return fields;
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
  const pathTemplate = collection.get('preview_path') as string;
  let fields = entry.get('data') as Map<string, string>;
  fields = addFileTemplateFields(entry.get('path'), fields);
  const date = parseDateFromEntry(entry, collection, collection.get('preview_path_date_field'));

  // Prepare and sanitize slug variables only, leave the rest of the
  // `preview_path` template as is.
  const processSegment = getProcessSegment(slugConfig);
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
  const entryData = entry.get('data');
  const date = parseDateFromEntry(entry, collection) || null;
  const identifier = entryData.getIn(keyToPathArray(selectIdentifier(collection) as string));
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
  fields = addFileTemplateFields(entry.get('path'), fields);

  const date = parseDateFromEntry(entry, collection) || null;
  const identifier = fields.getIn(keyToPathArray(selectIdentifier(collection) as string));
  const processSegment = getProcessSegment(slugConfig);

  const mediaFolder = compileStringTemplate(
    folderTemplate,
    date,
    identifier,
    fields,
    (value: string) => (value === defaultFolder ? defaultFolder : processSegment(value)),
  );
  return mediaFolder;
};
