import AJV from 'ajv';
import {
  select,
  uniqueItemProperties,
  instanceof as instanceOf,
  prohibited,
} from 'ajv-keywords/dist/keywords';
import ajvErrors from 'ajv-errors';
import uuid from 'uuid/v4';

import { formatExtensions, frontmatterFormats, extensionFormatters } from '../formats/formats';
import { getWidgets } from '../lib/registry';
import { I18N_STRUCTURE, I18N_FIELD } from '../lib/i18n';
import schema from '../../config.schema.json';
import validateSchema from './validateSchema';
import { set } from 'lodash/fp'

const localeType = { type: 'string', minLength: 2, maxLength: 10, pattern: '^[a-zA-Z-_]+$' };

// taken from config.schema.json
// config.properties.collections.items.properties.files.items.properties.fields.items.selectCases
const NativeCMSWidgets = [
  'unknown',
  'string',
  'number',
  'text',
  'image',
  'file',
  'select',
  'markdown',
  'list',
  'object',
  'relation',
  'boolean',
  'map',
  'date',
  'datetime',
  'code',
  'color',
];

const i18n = {
  type: 'object',
  properties: {
    structure: { type: 'string', enum: Object.values(I18N_STRUCTURE) },
    locales: {
      type: 'array',
      minItems: 2,
      items: localeType,
      uniqueItems: true,
    },
    default_locale: localeType,
  },
};

const i18nRoot = {
  ...i18n,
  required: ['structure', 'locales'],
};

const i18nCollection = {
  oneOf: [{ type: 'boolean' }, i18n],
};

const i18nField = {
  oneOf: [{ type: 'boolean' }, { type: 'string', enum: Object.values(I18N_FIELD) }],
};

/**
 * Config for fields in both file and folder collections.
 */
function fieldsConfig() {
  const id = uuid();
  return {
    $id: `fields_${id}`,
    type: 'array',
    minItems: 1,
    items: {
      // ------- Each field: -------
      $id: `field_${id}`,
      type: 'object',
      properties: {
        name: { type: 'string' },
        label: { type: 'string' },
        widget: { type: 'string' },
        required: { type: 'boolean' },
        i18n: i18nField,
        hint: { type: 'string' },
        pattern: {
          type: 'array',
          minItems: 2,
          items: [{ oneOf: [{ type: 'string' }, { instanceof: 'RegExp' }] }, { type: 'string' }],
        },
        field: { $ref: `field_${id}` },
        fields: { $ref: `fields_${id}` },
        types: { $ref: `fields_${id}` },
      },
      select: { $data: '0/widget' },
      selectCases: {
        ...getWidgetSchemas(),
      },
      required: ['name'],
    },
    uniqueItemProperties: ['name'],
  };
}

const viewFilters = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    properties: {
      label: { type: 'string' },
      field: { type: 'string' },
      pattern: {
        oneOf: [
          { type: 'boolean' },
          {
            type: 'string',
          },
        ],
      },
    },
    additionalProperties: false,
    required: ['label', 'field', 'pattern'],
  },
};

const viewGroups = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    properties: {
      label: { type: 'string' },
      field: { type: 'string' },
      pattern: { type: 'string' },
    },
    additionalProperties: false,
    required: ['label', 'field'],
  },
};

/**
 * The schema had to be wrapped in a function to
 * fix a circular dependency problem for WebPack,
 * where the imports get resolved asynchronously.
 */
function getConfigSchema() {

  // This will immutably apply fields schema to the schema properrites that need them
  // TODO: it might be better to use ref here as per https://github.com/ajv-validator/ajv/issues/1707#issuecomment-890479942

  const s1 = set('properties.collections.items.properties.files.items.properties.fields', fieldsConfig(), schema);
  const s2 = set('properties.collections.items.properties.fields', fieldsConfig(), s1);

  return s2;
}

function getWidgetSchemas() {
  const schemas = getWidgets().map(widget => ({ [widget.name]: widget.schema }));
  return Object.assign(...schemas);
}

class ConfigError extends Error {
  constructor(errors, ...args) {
    const message = errors
      .map(({ message, instancePath }) => {
        const dotPath = instancePath
          .slice(1)
          .split('/')
          .map(seg => (seg.match(/^\d+$/) ? `[${seg}]` : `.${seg}`))
          .join('')
          .slice(1);
        return `${dotPath ? `'${dotPath}'` : 'config'} ${message}`;
      })
      .join('\n');
    super(message, ...args);

    this.errors = errors;
    this.message = message;
  }

  toString() {
    return this.message;
  }
}

/**
 * `validateConfig` is a pure function. It does not mutate
 * the config that is passed in.
 */
function dynamicValidateConfig(config) {
  const ajv = new AJV({ allErrors: true, $data: true, strict: false });
  uniqueItemProperties(ajv);
  select(ajv);
  instanceOf(ajv);
  prohibited(ajv);
  ajvErrors(ajv);

  const valid = ajv.validate(getConfigSchema(), config);
  if (!valid) {
    const errors = ajv.errors.map(e => {
      switch (e.keyword) {
        // TODO: remove after https://github.com/ajv-validator/ajv-keywords/pull/123 is merged
        case 'uniqueItemProperties': {
          const path = e.instancePath || '';
          let newError = e;
          if (path.endsWith('/fields')) {
            newError = { ...e, message: 'fields names must be unique' };
          } else if (path.endsWith('/files')) {
            newError = { ...e, message: 'files names must be unique' };
          } else if (path.endsWith('/collections')) {
            newError = { ...e, message: 'collections names must be unique' };
          }
          return newError;
        }
        case 'instanceof': {
          const path = e.instancePath || '';
          let newError = e;
          if (/fields\/\d+\/pattern\/\d+/.test(path)) {
            newError = {
              ...e,
              message: 'must be a regular expression',
            };
          }
          return newError;
        }
        default:
          return e;
      }
    });
    console.error('Config Errors', errors);
    throw new ConfigError(errors);
  }
}


export function validateConfig(config) {
  const customWidgets = Object.keys(getWidgetSchemas()).filter(
    widgetKey => NativeCMSWidgets.includes(widgetKey) === false,
  );

  if (customWidgets.length > 0) {
    console.debug('using dynamic ajv validation');
    return dynamicValidateConfig(config);
  } else {
    console.debug('using static ajv validation');
    return validateSchema(config);
  }
}
