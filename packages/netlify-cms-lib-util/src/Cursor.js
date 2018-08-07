import { fromJS, Map, Set } from 'immutable';

const jsToMap = obj => {
  if (obj === undefined) {
    return Map();
  }
  const immutableObj = fromJS(obj);
  if (!Map.isMap(immutableObj)) {
    throw new Error('Object must be equivalent to a Map.');
  }
  return immutableObj;
};

const knownMetaKeys = Set(['index', 'count', 'pageSize', 'pageCount', 'usingOldPaginationAPI']);
const filterUnknownMetaKeys = meta => meta.filter((v, k) => knownMetaKeys.has(k));

/*
  createCursorMap takes one of three signatures:
  - () -> cursor with empty actions, data, and meta
  - (cursorMap: <object/Map with optional actions, data, and meta keys>) -> cursor
  - (actions: <array/List>, data: <object/Map>, meta: <optional object/Map>) -> cursor
*/
const createCursorMap = (...args) => {
  const { actions, data, meta } =
    args.length === 1
      ? jsToMap(args[0]).toObject()
      : { actions: args[0], data: args[1], meta: args[2] };
  return Map({
    // actions are a Set, rather than a List, to ensure an efficient .has
    actions: Set(actions),

    // data and meta are Maps
    data: jsToMap(data),
    meta: jsToMap(meta).update(filterUnknownMetaKeys),
  });
};

const hasAction = (cursorMap, action) => cursorMap.hasIn(['actions', action]);

const getActionHandlers = (cursorMap, handler) =>
  cursorMap
    .get('actions', Set())
    .toMap()
    .map(action => handler(action));

// The cursor logic is entirely functional, so this class simply
// provides a chainable interface
export default class Cursor {
  static create(...args) {
    return new Cursor(...args);
  }

  constructor(...args) {
    if (args[0] instanceof Cursor) {
      return args[0];
    }

    this.store = createCursorMap(...args);
    this.actions = this.store.get('actions');
    this.data = this.store.get('data');
    this.meta = this.store.get('meta');
  }

  updateStore(...args) {
    return new Cursor(this.store.update(...args));
  }
  updateInStore(...args) {
    return new Cursor(this.store.updateIn(...args));
  }

  hasAction(action) {
    return hasAction(this.store, action);
  }
  addAction(action) {
    return this.updateStore('actions', actions => actions.add(action));
  }
  removeAction(action) {
    return this.updateStore('actions', actions => actions.delete(action));
  }
  setActions(actions) {
    return this.updateStore(store => store.set('actions', Set(actions)));
  }
  mergeActions(actions) {
    return this.updateStore('actions', oldActions => oldActions.union(actions));
  }
  getActionHandlers(handler) {
    return getActionHandlers(this.store, handler);
  }

  setData(data) {
    return new Cursor(this.store.set('data', jsToMap(data)));
  }
  mergeData(data) {
    return new Cursor(this.store.mergeIn(['data'], jsToMap(data)));
  }
  wrapData(data) {
    return this.updateStore('data', oldData => jsToMap(data).set('wrapped_cursor_data', oldData));
  }
  unwrapData() {
    return [
      this.store.get('data').delete('wrapped_cursor_data'),
      this.updateStore('data', data => data.get('wrapped_cursor_data')),
    ];
  }
  clearData() {
    return this.updateStore('data', () => Map());
  }

  setMeta(meta) {
    return this.updateStore(store => store.set('meta', jsToMap(meta)));
  }
  mergeMeta(meta) {
    return this.updateStore(store => store.update('meta', oldMeta => oldMeta.merge(jsToMap(meta))));
  }
}

// This is a temporary hack to allow cursors to be added to the
// interface between backend.js and backends without modifying old
// backends at all. This should be removed in favor of wrapping old
// backends with a compatibility layer, as part of the backend API
// refactor.
export const CURSOR_COMPATIBILITY_SYMBOL = Symbol('cursor key for compatibility with old backends');
