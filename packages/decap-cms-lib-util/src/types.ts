import { Map as ImmutableMap, List } from 'immutable';

export function isImmutableMap(value: unknown): value is ImmutableMap<string, unknown> {
  return ImmutableMap.isMap(value);
}

export function isImmutableList(value: unknown): value is List<unknown> {
  return List.isList(value);
}
