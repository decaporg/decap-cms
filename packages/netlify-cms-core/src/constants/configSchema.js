import AJV from 'ajv';
import { select, uniqueItemProperties, instanceof as instanceOf } from 'ajv-keywords/keywords';
import ajvErrors from 'ajv-errors';
import { formatExtensions, frontmatterFormats, extensionFormatters } from 'Formats/formats';
import { getWidgets } from 'Lib/registry';
import {
  locales,
  SINGLE_FILE,
  LOCALE_FILE_EXTENSIONS,
  LOCALE_FOLDERS,
} from 'Constants/multiContentTypes';

/**
 * Config for fields in both file and folder collections.
 */
const fieldsConfig = () => ({
  $id: 'fields',
  type: 'array',
  minItems: 1,
  items: {
    // ------- Each field: -------
    $id: 'field',
    type: 'object',
    properties: {
      name: { type: 'string' },
      label: { type: 'string' },
      widget: { type: 'string' },
      required: { type: 'boolean' },
      translatable: { type: 'boolean' },
      duplicate: { type: 'boolean' },
      hint: { type: 'string' },
      pattern: {
        type: 'array',
        minItems: 2,
        items: [{ oneOf: [{ type: 'string' }, { instanceof: 'RegExp' }] }, { type: 'string' }],
      },
      field: { $ref: 'field' },
      fields: { $ref: 'fields' },
      types: { $ref: 'fields' },
    },
    select: { $data: '0/widget' },
    selectCases: {
      ...getWidgetSchemas(),
    },
    required: ['name'],
  },
  uniqueItemProperties: ['name'],
});

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

/**
 * The schema had to be wrapped in a function to
 * fix a circular dependency problem for WebPack,
 * where the imports get resolved asynchronously.
 */
const getConfigSchema = () => ({
  type: 'object',
  properties: {
    backend: {
      type: 'object',
      properties: {
        name: { type: 'string', examples: ['test-repo'] },
        auth_scope: {
          type: 'string',
          examples: ['repo', 'public_repo'],
          enum: ['repo', 'public_repo'],
        },
        open_authoring: { type: 'boolean', examples: [true] },
      },
      required: ['name'],
    },
    local_backend: {
      oneOf: [
        { type: 'boolean' },
        {
          type: 'object',
          properties: {
            url: { type: 'string', examples: ['http://localhost:8081/api/v1'] },
            allowed_hosts: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          additionalProperties: false,
        },
      ],
    },
    locale: { type: 'string', examples: ['en', 'fr', 'de'] },
    site_url: { type: 'string', examples: ['https://example.com'] },
    display_url: { type: 'string', examples: ['https://example.com'] },
    logo_url: { type: 'string', examples: ['https://example.com/images/logo.svg'] },
    show_preview_links: { type: 'boolean' },
    media_folder: { type: 'string', examples: ['assets/uploads'] },
    public_folder: { type: 'string', examples: ['/uploads'] },
    media_folder_relative: { type: 'boolean' },
    media_library: {
      type: 'object',
      properties: {
        name: { type: 'string', examples: ['uploadcare'] },
        config: { type: 'object' },
      },
      required: ['name'],
    },
    publish_mode: {
      type: 'string',
      enum: ['simple', 'editorial_workflow'],
      examples: ['editorial_workflow'],
    },
    slug: {
      type: 'object',
      properties: {
        encoding: { type: 'string', enum: ['unicode', 'ascii'] },
        clean_accents: { type: 'boolean' },
      },
    },
    locales: {
      type: 'array',
      minItems: 2,
      items: { type: 'string', enum: locales },
      uniqueItems: true,
    },
    collections: {
      type: 'array',
      minItems: 1,
      items: {
        // ------- Each collection: -------
        type: 'object',
        properties: {
          name: { type: 'string' },
          label: { type: 'string' },
          label_singular: { type: 'string' },
          description: { type: 'string' },
          folder: { type: 'string' },
          files: {
            type: 'array',
            items: {
              // ------- Each file: -------
              type: 'object',
              properties: {
                name: { type: 'string' },
                label: { type: 'string' },
                label_singular: { type: 'string' },
                description: { type: 'string' },
                file: { type: 'string' },
                fields: fieldsConfig(),
              },
              required: ['name', 'label', 'file', 'fields'],
            },
            uniqueItemProperties: ['name'],
          },
          identifier_field: { type: 'string' },
          summary: { type: 'string' },
          slug: { type: 'string' },
          path: { type: 'string' },
          preview_path: { type: 'string' },
          preview_path_date_field: { type: 'string' },
          create: { type: 'boolean' },
          publish: { type: 'boolean' },
          hide: { type: 'boolean' },
          editor: {
            type: 'object',
            properties: {
              preview: { type: 'boolean' },
            },
          },
          format: { type: 'string', enum: Object.keys(formatExtensions) },
          extension: { type: 'string' },
          frontmatter_delimiter: {
            type: ['string', 'array'],
            minItems: 2,
            maxItems: 2,
            items: {
              type: 'string',
            },
          },
          fields: fieldsConfig(),
          sortableFields: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          view_filters: viewFilters,
          nested: {
            type: 'object',
            properties: {
              depth: { type: 'number', minimum: 1, maximum: 1000 },
              summary: { type: 'string' },
            },
            required: ['depth'],
          },
          meta: {
            type: 'object',
            properties: {
              path: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  widget: { type: 'string' },
                  index_file: { type: 'string' },
                },
                required: ['label', 'widget', 'index_file'],
              },
            },
            additionalProperties: false,
            minProperties: 1,
          },
          i18n_structure: {
            type: 'string',
            enum: [SINGLE_FILE, LOCALE_FILE_EXTENSIONS, LOCALE_FOLDERS],
          },
          default_locale: { type: 'string', enum: locales },
        },
        required: ['name', 'label'],
        oneOf: [{ required: ['files'] }, { required: ['folder', 'fields'] }],
        if: { required: ['extension'] },
        then: {
          // Cannot infer format from extension.
          if: {
            properties: {
              extension: { enum: Object.keys(extensionFormatters) },
            },
          },
          else: { required: ['format'] },
        },
        dependencies: {
          frontmatter_delimiter: {
            properties: {
              format: { enum: frontmatterFormats },
            },
            required: ['format'],
          },
        },
      },
      uniqueItemProperties: ['name'],
    },
  },
  required: ['backend', 'collections'],
  anyOf: [{ required: ['media_folder'] }, { required: ['media_library'] }],
});

function getWidgetSchemas() {
  const schemas = getWidgets().map(widget => ({ [widget.name]: widget.schema }));
  return Object.assign(...schemas);
}

class ConfigError extends Error {
  constructor(errors, ...args) {
    const message = errors
      .map(({ message, dataPath }) => {
        const dotPath = dataPath
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
export function validateConfig(config) {
  const ajv = new AJV({ allErrors: true, jsonPointers: true, $data: true });
  uniqueItemProperties(ajv);
  select(ajv);
  instanceOf(ajv);
  ajvErrors(ajv);

  const valid = ajv.validate(getConfigSchema(), config);
  if (!valid) {
    const errors = ajv.errors.map(e => {
      switch (e.keyword) {
        // TODO: remove after https://github.com/ajv-validator/ajv-keywords/pull/123 is merged
        case 'uniqueItemProperties': {
          const path = e.dataPath || '';
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
          const path = e.dataPath || '';
          let newError = e;
          if (/fields\/\d+\/pattern\/\d+/.test(path)) {
            newError = {
              ...e,
              message: 'should be a regular expression',
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
