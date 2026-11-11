import { List, fromJS } from 'immutable';
import { stringTemplate } from 'decap-cms-lib-widgets';

import type { Map } from 'immutable';

type Filter = { field: string; values: unknown[] };

const FIELD_REFERENCE = /^{{\s*fields\.([^{}\s|]+)\s*}}$/;

function getFieldReference(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }
  return value.match(FIELD_REFERENCE)?.[1] ?? null;
}

function getFilters(field: Map<string, unknown>) {
  const filters = field.get('filters');
  return List.isList(filters) ? (filters.toJS() as Filter[]) : [];
}

export function hasFieldReferences(field: Map<string, unknown>) {
  return getFilters(field).some(filter =>
    filter.values.some(value => getFieldReference(value) !== null),
  );
}

/** Replaces filter values like `{{fields.author}}` with that field's current value(s); skips filters left empty. */
export function resolveFieldReferences(
  field: Map<string, unknown>,
  entryData?: Map<string, unknown>,
) {
  if (!hasFieldReferences(field)) {
    return field;
  }
  const filters = getFilters(field)
    .map(filter => ({
      ...filter,
      values: filter.values.flatMap(value => {
        const reference = getFieldReference(value);
        if (reference === null) {
          return [value];
        }
        const current = entryData?.getIn(stringTemplate.keyToPathArray(reference));
        const items = List.isList(current) ? current.toArray() : [current];
        return items.filter(item => item != null && item !== '' && typeof item !== 'object');
      }),
    }))
    .filter(filter => filter.values.length > 0);
  return field.set('filters', fromJS(filters));
}
