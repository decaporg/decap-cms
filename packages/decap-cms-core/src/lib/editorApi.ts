/**
 * The editor, reachable from outside React: read the entry open in the
 * editor, and change its fields the way a person typing would. Used by
 * extensions — the Decap Turbo editor bridge lets an AI agent fill in fields
 * that the person then reviews and saves — and exposed as `CMS.editor`.
 *
 * Nothing here saves. A patch goes through the same `changeDraftField`
 * action a widget's onChange dispatches, so validation, i18n duplication and
 * "unsaved changes" behave exactly as for typing, and the entry is only
 * written when someone presses Save.
 */
import { fromJS, List, Map } from 'immutable';

import { store } from '../redux';
import {
  changeDraftField,
  clearFieldHighlights,
  markFieldsExternallyChanged,
} from '../actions/entries';
import { selectEntry, selectUnpublishedEntry } from '../reducers';
import { selectFields } from '../reducers/collections';
import { getDataPath, getI18nInfo, isFieldTranslatable } from './i18n';

import type { Collection, EntryField, EntryMap } from '../types/redux';

export interface EditorSnapshot {
  collection: string;
  collectionLabel: string;
  /** The entry's slug, or the file's name in a file collection; null for a new entry. */
  slug: string | null;
  newRecord: boolean;
  path: string | null;
  /** The collection's field definitions, as in config.yml. */
  fields: Record<string, unknown>[];
  /** The current, possibly unsaved, values of the default locale. */
  data: Record<string, unknown>;
  /** Other locales' values, keyed by locale, when the collection has i18n. */
  i18n: Record<string, { data: Record<string, unknown> }> | null;
  locales: string[] | null;
  defaultLocale: string | null;
  hasChanged: boolean;
}

/** One change: `path` is a field name, or a dotted path into an object or list (`seo.description`, `tags.0`). */
export interface FieldPatch {
  path: string;
  value: unknown;
}

export interface PatchResult {
  applied: string[];
  rejected: { path: string; reason: string }[];
}

/** Widgets whose value is a plain string; a patch giving them anything else is refused rather than rendered broken. */
const STRING_WIDGETS = new Set([
  'string',
  'text',
  'markdown',
  'richtext',
  'color',
  'datetime',
  'select',
]);

/** How long a patched field stays highlighted, in ms. */
const HIGHLIGHT_MS = 4000;

interface Context {
  collection: Collection;
  collectionName: string;
  entry: EntryMap;
  fields: List<EntryField>;
  slug: string;
}

function openEntry(): Context | null {
  const state = store.getState();
  if (!state) return null;
  const entry = state.entryDraft.get('entry') as EntryMap | undefined;
  // The typed EntryMap omits the transient keys a draft also carries.
  const raw = entry as unknown as Map<string, unknown> | undefined;
  if (!entry || !raw || raw.size === 0 || raw.get('partial') === true) return null;

  const collectionName = entry.get('collection');
  const collection = state.collections.get(collectionName);
  if (!collection) return null;

  const slug = entry.get('slug');
  const fields = selectFields(collection, slug);
  if (!fields) return null;
  return { collection, collectionName, entry, fields, slug };
}

export function getCurrentEntry(): EditorSnapshot | null {
  const context = openEntry();
  if (!context) return null;
  const { collection, collectionName, entry, fields } = context;
  const { locales, defaultLocale } = getI18nInfo(collection) as {
    locales?: string[];
    defaultLocale?: string;
  };
  const state = store.getState()!;

  return {
    collection: collectionName,
    collectionLabel: collection.get('label') ?? collectionName,
    slug: entry.get('newRecord') ? null : entry.get('slug') ?? null,
    newRecord: Boolean(entry.get('newRecord')),
    path: entry.get('path') ?? null,
    fields: fields.toJS() as Record<string, unknown>[],
    data: (entry.get('data')?.toJS() ?? {}) as Record<string, unknown>,
    i18n: (entry.get('i18n')?.toJS() ?? null) as EditorSnapshot['i18n'],
    locales: locales ?? null,
    defaultLocale: defaultLocale ?? null,
    hasChanged: Boolean((state.entryDraft as unknown as Map<string, unknown>).get('hasChanged')),
  };
}

function checkValue(field: EntryField, isWholeField: boolean, value: unknown): string | null {
  if (!isWholeField) return null;
  const widget = field.get('widget');
  if (field.get('multiple') && Array.isArray(value)) return null;
  if (STRING_WIDGETS.has(widget) && typeof value !== 'string')
    return `${widget} fields take a string`;
  if (widget === 'boolean' && typeof value !== 'boolean')
    return 'boolean fields take true or false';
  if (widget === 'number' && typeof value !== 'number' && typeof value !== 'string') {
    return 'number fields take a number';
  }
  if (widget === 'list' && !Array.isArray(value)) return 'list fields take an array';
  if (
    widget === 'object' &&
    (value === null || typeof value !== 'object' || Array.isArray(value))
  ) {
    return 'object fields take an object';
  }
  return null;
}

/**
 * Applies changes to the open entry, without saving. Each patch is accepted or
 * refused on its own; refusals say why (unknown field, wrong type). `locale`
 * targets another language of an i18n collection; the default locale
 * otherwise.
 */
export function applyFieldPatch(
  patches: FieldPatch[],
  options: { locale?: string } = {},
): PatchResult {
  const result: PatchResult = { applied: [], rejected: [] };
  const context = openEntry();
  if (!context) {
    for (const patch of patches)
      result.rejected.push({ path: patch.path, reason: 'no entry is open' });
    return result;
  }

  const { collection, collectionName, fields, slug } = context;
  const { locales, defaultLocale } = getI18nInfo(collection) as {
    locales?: string[];
    defaultLocale?: string;
  };
  const locale = options.locale ?? defaultLocale;
  if (options.locale && (!locales || !locales.includes(options.locale))) {
    for (const patch of patches) {
      result.rejected.push({
        path: patch.path,
        reason: `this collection has no locale "${options.locale}"`,
      });
    }
    return result;
  }
  const i18n =
    locales && locale && defaultLocale
      ? { currentLocale: locale, defaultLocale, locales }
      : undefined;
  const dataPath = (i18n && getDataPath(i18n.currentLocale, i18n.defaultLocale)) || ['data'];

  const touched = new Set<string>();
  for (const patch of patches) {
    const segments = String(patch.path).split('.').filter(Boolean);
    const field = fields.find(f => f!.get('name') === segments[0]);
    if (!field) {
      result.rejected.push({ path: patch.path, reason: 'no such field' });
      continue;
    }
    if (field.get('widget') === 'hidden') {
      result.rejected.push({ path: patch.path, reason: 'hidden fields cannot be edited' });
      continue;
    }
    if (i18n && locale !== defaultLocale && !isFieldTranslatable(field, locale!, defaultLocale!)) {
      result.rejected.push({
        path: patch.path,
        reason: `this field is not translated into "${locale}"`,
      });
      continue;
    }
    const problem = checkValue(field, segments.length === 1, patch.value);
    if (problem) {
      result.rejected.push({ path: patch.path, reason: problem });
      continue;
    }

    // Read the draft fresh for every patch: an earlier patch in the same
    // batch may have changed the same field.
    const state = store.getState()!;
    const entry = state.entryDraft.get('entry') as EntryMap;
    const valuePath = field.get('meta') ? ['meta', segments[0]] : [...dataPath, segments[0]];
    const current = entry.getIn(valuePath);
    const incoming = fromJS(patch.value);
    let next;
    if (segments.length === 1) {
      next = incoming;
    } else {
      const keyPath = segments
        .slice(1)
        .map(segment => (/^\d+$/.test(segment) ? Number(segment) : segment));
      const base = current ?? (typeof keyPath[0] === 'number' ? List() : Map());
      if (!Map.isMap(base) && !List.isList(base)) {
        result.rejected.push({ path: patch.path, reason: `${segments[0]} has no nested values` });
        continue;
      }
      next = (base as Map<string, unknown>).setIn(keyPath, incoming);
    }

    const entries = [
      selectUnpublishedEntry(state, collectionName, slug),
      selectEntry(state, collectionName, slug),
    ].filter(Boolean) as EntryMap[];
    store.dispatch(changeDraftField({ field, value: next as string, metadata: {}, entries, i18n }));
    result.applied.push(patch.path);
    touched.add(segments[0]);
  }

  if (touched.size > 0) {
    const names = [...touched];
    store.dispatch(markFieldsExternallyChanged(names));
    setTimeout(() => store.dispatch(clearFieldHighlights(names)), HIGHLIGHT_MS);
  }
  return result;
}

/**
 * Calls `listener` whenever the open entry changes — opened, closed, or a
 * field edited — with a fresh snapshot, or null when no entry is open.
 * Returns the unsubscribe function. Fires on every draft change; debounce in
 * the listener if it does anything expensive.
 */
export function onEditorChange(listener: (snapshot: EditorSnapshot | null) => void): () => void {
  let lastDraft: unknown = undefined;
  return store.subscribe(() => {
    const draft = store.getState()?.entryDraft;
    if (draft === lastDraft) return;
    lastDraft = draft;
    listener(getCurrentEntry());
  });
}

export const editorApi = { getCurrentEntry, applyFieldPatch, onEditorChange };
