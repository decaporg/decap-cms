import { Map } from 'immutable';
import { keyToPathArray } from './util';

export type PatternFilter = {
  field: string;
  pattern: string | boolean;
};

export type NumberFilter = {
  field: string;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  eq?: number;
  neq?: number;
};

export type Filter = PatternFilter | NumberFilter;

function isPatternFilter(filter: Filter) {
  return (filter as PatternFilter).pattern !== undefined;
}

function isNumberFilter(filter: Filter) {
  const f = filter as NumberFilter;
  return (
    f.lt !== undefined ||
    f.lte !== undefined ||
    f.gt !== undefined ||
    f.gte !== undefined ||
    f.eq !== undefined ||
    f.neq !== undefined
  );
}

function matchesPatternFilter(toMatch: unknown, filter: PatternFilter) {
  return toMatch !== undefined && new RegExp(String(filter.pattern)).test(String(toMatch));
}

function matchesNumberFilter(toMatch: unknown, filter: NumberFilter) {
  const n = Number(toMatch);
  return (
    !isNaN(n) &&
    (filter.lt === undefined || n < filter.lt) &&
    (filter.lte === undefined || n <= filter.lte) &&
    (filter.gt === undefined || n < filter.gt) &&
    (filter.gte === undefined || n < filter.gte) &&
    (filter.eq === undefined || n < filter.eq) &&
    (filter.neq === undefined || n < filter.neq)
  );
}

export function matchesFilter(data: Map<string, unknown>, filter: Filter) {
  const value = data.getIn(keyToPathArray(filter.field));
  if (isPatternFilter(filter)) {
    return matchesPatternFilter(value, filter as PatternFilter);
  } else if (isNumberFilter(filter)) {
    return matchesNumberFilter(value, filter);
  } else {
    throw new Error(`${JSON.stringify(filter)} is not a valid filter.`);
  }
}
