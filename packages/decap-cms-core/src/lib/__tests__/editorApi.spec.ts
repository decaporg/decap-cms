import { fromJS, Map } from 'immutable';

import { DRAFT_CHANGE_FIELD, DRAFT_FIELDS_EXTERNALLY_CHANGED } from '../../actions/entries';

/**
 * CMS.editor: reading the open entry and patching its fields from outside
 * React. A fake store runs the real entryDraft reducer, so each test sees the
 * draft exactly as the editor would after the patch.
 */

const mockStore: {
  state: Record<string, unknown>;
  dispatched: { type: string; payload?: unknown }[];
} = { state: {}, dispatched: [] };

jest.mock('../../redux', () => ({
  store: {
    getState: () => mockStore.state,
    dispatch: (action: { type: string }) => {
      mockStore.dispatched.push(action);
      mockStore.state = {
        ...mockStore.state,
        // Required lazily: jest.mock factories may not close over imports.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        entryDraft: require('../../reducers/entryDraft').default(
          mockStore.state.entryDraft,
          action,
        ),
      };
      return action;
    },
    subscribe: jest.fn(() => () => undefined),
  },
}));

// After jest.mock, so the module sees the fake store.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { applyFieldPatch, getCurrentEntry } = require('../editorApi');

const posts = fromJS({
  name: 'posts',
  label: 'Posts',
  type: 'folder_based_collection',
  folder: 'content/posts',
  fields: [
    { name: 'title', widget: 'string' },
    { name: 'draft', widget: 'boolean' },
    { name: 'tags', widget: 'list' },
    { name: 'seo', widget: 'object', fields: [{ name: 'description', widget: 'text' }] },
    { name: 'body', widget: 'markdown' },
    { name: 'secret', widget: 'hidden' },
  ],
});

const pages = posts.merge(
  fromJS({
    name: 'pages',
    // As normalizeConfig leaves it: default_locale, and per-field translate/none.
    i18n: { structure: 'multiple_folders', locales: ['en', 'de'], default_locale: 'en' },
    fields: [
      { name: 'title', widget: 'string', i18n: 'translate' },
      { name: 'layout', widget: 'string', i18n: 'none' },
    ],
  }),
);

function openEntry(collection = 'posts', data: Record<string, unknown> = {}) {
  mockStore.dispatched = [];
  mockStore.state = {
    collections: Map({ posts, pages }),
    entries: fromJS({ entities: {} }),
    editorialWorkflow: fromJS({ entities: {} }),
    entryDraft: fromJS({
      entry: {
        collection,
        slug: 'hello',
        path: `content/${collection}/hello.md`,
        newRecord: false,
        data: {
          title: 'Hello',
          draft: false,
          tags: ['a', 'b'],
          seo: { description: 'Old' },
          body: 'Body',
          ...data,
        },
        i18n: collection === 'pages' ? { de: { data: { title: 'Hallo' } } } : undefined,
      },
      fieldsMetaData: {},
      fieldsErrors: {},
      hasChanged: false,
      fieldRevisions: {},
      fieldHighlights: {},
    }),
  };
}

function draftData() {
  return (mockStore.state.entryDraft as Map<string, unknown>).getIn(['entry', 'data']).toJS();
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('getCurrentEntry', () => {
  it('returns null when no entry is open', () => {
    openEntry();
    mockStore.state.entryDraft = fromJS({ entry: {} });
    expect(getCurrentEntry()).toBeNull();
  });

  it('returns plain values: fields, data and identity', () => {
    openEntry();
    const snapshot = getCurrentEntry();
    expect(snapshot).toMatchObject({
      collection: 'posts',
      collectionLabel: 'Posts',
      slug: 'hello',
      newRecord: false,
      data: { title: 'Hello', tags: ['a', 'b'] },
      locales: null,
      hasChanged: false,
    });
    expect(snapshot.fields.map((f: { name: string }) => f.name)).toContain('seo');
  });
});

describe('applyFieldPatch', () => {
  it('sets top-level fields through changeDraftField and marks the draft changed', () => {
    openEntry();
    const result = applyFieldPatch([
      { path: 'title', value: 'New title' },
      { path: 'body', value: '# Heading' },
    ]);
    expect(result).toEqual({ applied: ['title', 'body'], rejected: [] });
    expect(draftData()).toMatchObject({ title: 'New title', body: '# Heading' });
    expect((mockStore.state.entryDraft as Map<string, unknown>).get('hasChanged')).toBe(true);
    expect(mockStore.dispatched.filter(a => a.type === DRAFT_CHANGE_FIELD)).toHaveLength(2);
  });

  it('sets nested values inside objects and lists', () => {
    openEntry();
    applyFieldPatch([
      { path: 'seo.description', value: 'New description' },
      { path: 'tags.1', value: 'changed' },
      { path: 'tags.2', value: 'added' },
    ]);
    expect(draftData()).toMatchObject({
      seo: { description: 'New description' },
      tags: ['a', 'changed', 'added'],
    });
  });

  it('refuses unknown fields, hidden fields and wrong types, applying the rest', () => {
    openEntry();
    const result = applyFieldPatch([
      { path: 'nope', value: 'x' },
      { path: 'secret', value: 'x' },
      { path: 'title', value: 42 },
      { path: 'draft', value: 'yes' },
      { path: 'tags', value: 'not a list' },
      { path: 'title.inner', value: 'x' },
      { path: 'draft', value: true },
    ]);
    expect(result.applied).toEqual(['draft']);
    expect(result.rejected.map((r: { path: string }) => r.path)).toEqual([
      'nope',
      'secret',
      'title',
      'draft',
      'tags',
      'title.inner',
    ]);
    expect(draftData()).toMatchObject({ title: 'Hello', draft: true });
  });

  it('remounts and highlights the touched fields, then clears the highlight', () => {
    openEntry();
    applyFieldPatch([
      { path: 'body', value: 'x' },
      { path: 'seo.description', value: 'y' },
    ]);
    const draft = mockStore.state.entryDraft as Map<string, unknown>;
    expect(draft.get('fieldRevisions').toJS()).toEqual({ body: 1, seo: 1 });
    expect(draft.get('fieldHighlights').toJS()).toEqual({ body: true, seo: true });
    expect(mockStore.dispatched.some(a => a.type === DRAFT_FIELDS_EXTERNALLY_CHANGED)).toBe(true);

    jest.runAllTimers();
    expect(
      (mockStore.state.entryDraft as Map<string, unknown>).get('fieldHighlights').toJS(),
    ).toEqual({});
  });

  it('writes another locale of an i18n collection, and only translatable fields', () => {
    openEntry('pages');
    const result = applyFieldPatch(
      [
        { path: 'title', value: 'Neuer Titel' },
        { path: 'layout', value: 'wide' },
      ],
      { locale: 'de' },
    );
    expect(result.applied).toEqual(['title']);
    expect(result.rejected[0]).toMatchObject({ path: 'layout' });
    const entry = (mockStore.state.entryDraft as Map<string, unknown>).get('entry') as Map<
      string,
      unknown
    >;
    expect(entry.getIn(['i18n', 'de', 'data', 'title'])).toBe('Neuer Titel');
    expect(entry.getIn(['data', 'title'])).toBe('Hello');
  });

  it('refuses a locale the collection does not have', () => {
    openEntry('pages');
    expect(
      applyFieldPatch([{ path: 'title', value: 'x' }], { locale: 'fr' }).rejected,
    ).toHaveLength(1);
  });

  it('refuses everything when no entry is open', () => {
    openEntry();
    mockStore.state.entryDraft = fromJS({ entry: {} });
    expect(applyFieldPatch([{ path: 'title', value: 'x' }])).toEqual({
      applied: [],
      rejected: [{ path: 'title', reason: 'no entry is open' }],
    });
  });
});
