/**
 * Guards dev-test/config.yml — the config demo.decapcms.org serves — against
 * Decap's own schema validation and config normalization, so a broken demo config
 * fails here instead of in the browser.
 */
import fs from 'fs';
import path from 'path';

import { validateConfig } from '../../packages/decap-cms-core/src/constants/configSchema';
import { parseConfig, applyDefaults } from '../../packages/decap-cms-core/src/actions/config';

jest.mock('../../packages/decap-cms-core/src/lib/registry');

const { getWidgets, getBackend } = require('../../packages/decap-cms-core/src/lib/registry');

const SCHEMA_WIDGETS = [
  'code',
  'datetime',
  'file',
  'image',
  'list',
  'map',
  'markdown',
  'number',
  'object',
  'relation',
  'richtext',
  'select',
];
const SCHEMALESS_WIDGETS = ['boolean', 'colorstring', 'string', 'text', 'uuid', 'hidden'];

getWidgets.mockImplementation(() => [
  ...SCHEMA_WIDGETS.map(name => ({
    name: name === 'colorstring' ? 'color' : name,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    schema: require(`../../packages/decap-cms-widget-${name}/src/schema.js`).default,
  })),
  ...SCHEMALESS_WIDGETS.map(name => ({ name, schema: {} })),
  // registered by dev-test/index.html via CMS.registerWidget(..., 'relation', ...)
  {
    name: 'relationKitchenSinkPost',
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    schema: require('../../packages/decap-cms-widget-relation/src/schema.js').default,
  },
  { name: 'color', schema: {} },
]);

// applyDefaults resolves the configured backend; the demo uses test-repo.
getBackend.mockImplementation(name => (name === 'test-repo' ? { init: () => ({}) } : undefined));

describe('dev-test/config.yml (the demo.decapcms.org config)', () => {
  const raw = fs.readFileSync(path.resolve(__dirname, '../config.yml'), 'utf8');
  const parsed = parseConfig(raw);

  it('passes Decap config schema validation', () => {
    expect(() => validateConfig(parsed)).not.toThrow();
  });

  it('normalizes to the feature set the demo is meant to show', () => {
    const cfg = applyDefaults(parseConfig(raw));
    const byName = Object.fromEntries(cfg.collections.map(c => [c.name, c]));

    // Notes pane: enabled globally, cascades to every collection, needs editorial workflow
    expect(cfg.publish_mode).toBe('editorial_workflow');
    expect(cfg.editor.notes).toBe(true);
    expect(byName.books.editor.notes).toBe(true);
    expect(byName.posts.editor.notes).toBe(true);

    // Two i18n structures side by side: global multiple_folders, per-collection single_file
    expect(byName.localized_pages.i18n).toMatchObject({
      structure: 'multiple_folders',
      locales: ['en', 'es', 'fr'],
      default_locale: 'en',
    });
    expect(byName.i18n_posts.i18n).toMatchObject({
      structure: 'single_file',
      locales: ['en', 'de'],
      default_locale: 'en',
    });

    // `nested` cannot be combined with `multiple_folders`: getLocaleFromPath reads the
    // locale from the path segment above the file, which is only the locale at depth 1.
    // Opening a nested entry would otherwise render blank fields.
    expect(byName.pages.nested).toBeTruthy();
    expect(byName.pages.i18n).toBeUndefined();

    // Per-collection media folder override on books
    expect(byName.books.media_folder).toBe('assets/uploads/books');
    expect(byName.books.public_folder).toBe('/assets/uploads/books');
  });
});
