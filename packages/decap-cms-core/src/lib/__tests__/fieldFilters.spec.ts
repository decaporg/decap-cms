import { fromJS } from 'immutable';

import { getEmptyReferences, hasFieldReferences, resolveFieldReferences } from '../fieldFilters';

function relationField(values: unknown[]) {
  return fromJS({
    name: 'author',
    widget: 'relation',
    filters: [{ field: 'category', values }],
  });
}

function resolvedValues(values: unknown[], data: Record<string, unknown>) {
  return resolveFieldReferences(relationField(values), fromJS(data)).toJS().filters;
}

describe('hasFieldReferences', () => {
  it('detects a reference to another field', () => {
    expect(hasFieldReferences(relationField(['{{fields.category}}']))).toBe(true);
  });

  it('ignores fixed values and fields without filters', () => {
    expect(hasFieldReferences(relationField(['news']))).toBe(false);
    expect(hasFieldReferences(fromJS({ name: 'title', widget: 'string' }))).toBe(false);
  });
});

describe('resolveFieldReferences', () => {
  it('returns the same field when nothing references another field', () => {
    const field = relationField(['news']);
    expect(resolveFieldReferences(field, fromJS({ category: 'blog' }))).toBe(field);
  });

  it('replaces a reference with the current value', () => {
    expect(resolvedValues(['{{fields.category}}'], { category: 'blog' })).toEqual([
      { field: 'category', values: ['blog'] },
    ]);
  });

  it('keeps fixed values next to a reference', () => {
    expect(resolvedValues(['news', '{{fields.category}}'], { category: 'blog' })).toEqual([
      { field: 'category', values: ['news', 'blog'] },
    ]);
  });

  it('adds every item of a list field', () => {
    expect(resolvedValues(['{{fields.category}}'], { category: ['blog', 'news'] })).toEqual([
      { field: 'category', values: ['blog', 'news'] },
    ]);
  });

  it('reads nested fields', () => {
    expect(resolvedValues(['{{fields.meta.category}}'], { meta: { category: 'blog' } })).toEqual([
      { field: 'category', values: ['blog'] },
    ]);
  });

  it('matches nothing while the referenced field is empty', () => {
    const empty = [{ field: 'category', values: [] }];
    expect(resolvedValues(['{{fields.category}}'], {})).toEqual(empty);
    expect(resolvedValues(['{{fields.category}}'], { category: '' })).toEqual(empty);
    expect(resolvedValues(['{{fields.category}}'], { category: [] })).toEqual(empty);
  });

  it('treats a reference inside other text as a fixed value', () => {
    expect(resolvedValues(['x-{{fields.category}}'], { category: 'blog' })).toEqual([
      { field: 'category', values: ['x-{{fields.category}}'] },
    ]);
  });
});

describe('getEmptyReferences', () => {
  it('lists referenced fields that are empty', () => {
    const field = relationField(['{{fields.category}}']);
    expect(getEmptyReferences(field, fromJS({}))).toEqual(['category']);
  });

  it('ignores referenced fields that have a value', () => {
    const field = relationField(['{{fields.category}}']);
    expect(getEmptyReferences(field, fromJS({ category: 'blog' }))).toEqual([]);
  });

  it('ignores fixed values', () => {
    expect(getEmptyReferences(relationField(['news']), fromJS({}))).toEqual([]);
  });
});
