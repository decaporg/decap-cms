import { vercelStegaEncode } from '@vercel/stega';

import { isImmutableMap, isImmutableList } from './types';

import type { Map as ImmutableMap, List } from 'immutable';
import type { CmsField } from 'decap-cms-core';

/**
 * Context passed to encode functions, containing the current state of the encoding process
 */
interface EncodeContext {
  fields: CmsField[]; // Available CMS fields at current level
  path: string; // Path to current value in object tree
  visit: (value: unknown, fields: CmsField[], path: string) => unknown; // Visitor for recursive traversal
}

/**
 * Get the fields that should be used for encoding nested values
 */
function getNestedFields(f?: CmsField): CmsField[] {
  if (f) {
    if ('types' in f) {
      return f.types ?? [];
    }
    if ('fields' in f) {
      return f.fields ?? [];
    }
    if ('field' in f) {
      return f.field ? [f.field] : [];
    }
    return [f];
  }
  return [];
}

/**
 * Encode a string value by appending steganographic data
 * For markdown fields, encode each paragraph separately
 */
function encodeString(value: string, { fields, path }: EncodeContext): string {
  const stega = vercelStegaEncode({ decap: path });
  const isMarkdown = fields[0]?.widget === 'markdown';

  if (isMarkdown && value.includes('\n\n')) {
    const blocks = value.split(/(\n\n+)/);
    return blocks.map(block => (block.trim() ? block + stega : block)).join('');
  }
  return value + stega;
}

/**
 * Encode a list of values, handling both simple values and nested objects/lists
 * For typed lists, use the type field to determine which fields to use
 */
function encodeList(list: List<unknown>, ctx: EncodeContext): List<unknown> {
  let newList = list;
  for (let i = 0; i < newList.size; i++) {
    const item = newList.get(i);
    if (isImmutableMap(item)) {
      const itemType = item.get('type');
      if (typeof itemType === 'string') {
        // For typed items, look up fields based on type
        const field = ctx.fields.find(f => f.name === itemType);
        const newItem = ctx.visit(item, getNestedFields(field), `${ctx.path}.${i}`);
        newList = newList.set(i, newItem);
      } else {
        // For untyped items, use current fields
        const newItem = ctx.visit(item, ctx.fields, `${ctx.path}.${i}`);
        newList = newList.set(i, newItem);
      }
    } else {
      // For simple values, use first field if available
      const field = ctx.fields[0];
      const newItem = ctx.visit(item, field ? [field] : [], `${ctx.path}.${i}`);
      if (newItem !== item) {
        newList = newList.set(i, newItem);
      }
    }
  }
  return newList;
}

/**
 * Encode a map of values, looking up the appropriate field for each key
 * and recursively encoding nested values
 */
function encodeMap(
  map: ImmutableMap<string, unknown>,
  ctx: EncodeContext,
): ImmutableMap<string, unknown> {
  let newMap = map;
  for (const [key, val] of newMap.entrySeq().toArray()) {
    const field = ctx.fields.find(f => f.name === key);
    if (field) {
      const fields = getNestedFields(field);
      const newVal = ctx.visit(val, fields, ctx.path ? `${ctx.path}.${key}` : key);
      if (newVal !== val) {
        newMap = newMap.set(key, newVal);
      }
    }
  }
  return newMap;
}

/**
 * Main entry point for encoding steganographic data into entry values
 * Uses a visitor pattern with caching to handle recursive structures
 */
export function encodeEntry(value: unknown, fields: List<ImmutableMap<string, unknown>>) {
  const plainFields = fields.toJS() as CmsField[];
  const cache = new Map();

  function visit(value: unknown, fields: CmsField[], path = '') {
    const cached = cache.get(path);
    if (cached === value) return value;

    const ctx: EncodeContext = { fields, path, visit };
    let result;
    if (isImmutableList(value)) {
      result = encodeList(value, ctx);
    } else if (isImmutableMap(value)) {
      result = encodeMap(value, ctx);
    } else if (typeof value === 'string') {
      result = encodeString(value, ctx);
    } else {
      result = value;
    }

    cache.set(path, result);
    return result;
  }

  return visit(value, plainFields);
}
