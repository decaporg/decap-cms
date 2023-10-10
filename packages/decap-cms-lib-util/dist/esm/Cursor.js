"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CURSOR_COMPATIBILITY_SYMBOL = void 0;
var _immutable = require("immutable");
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function jsToMap(obj) {
  if (obj === undefined) {
    return (0, _immutable.Map)();
  }
  const immutableObj = (0, _immutable.fromJS)(obj);
  if (!_immutable.Map.isMap(immutableObj)) {
    throw new Error('Object must be equivalent to a Map.');
  }
  return immutableObj;
}
const knownMetaKeys = (0, _immutable.Set)(['index', 'page', 'count', 'pageSize', 'pageCount', 'usingOldPaginationAPI', 'extension', 'folder', 'depth']);
function filterUnknownMetaKeys(meta) {
  return meta.filter((_v, k) => knownMetaKeys.has(k));
}

/*
  createCursorMap takes one of three signatures:
  - () -> cursor with empty actions, data, and meta
  - (cursorMap: <object/Map with optional actions, data, and meta keys>) -> cursor
  - (actions: <array/List>, data: <object/Map>, meta: <optional object/Map>) -> cursor
*/
function createCursorStore(...args) {
  const {
    actions,
    data,
    meta
  } = args.length === 1 ? jsToMap(args[0]).toObject() : {
    actions: args[0],
    data: args[1],
    meta: args[2]
  };
  return (0, _immutable.Map)({
    // actions are a Set, rather than a List, to ensure an efficient .has
    actions: (0, _immutable.Set)(actions),
    // data and meta are Maps
    data: jsToMap(data),
    meta: jsToMap(meta).update(filterUnknownMetaKeys)
  });
}
function hasAction(store, action) {
  return store.hasIn(['actions', action]);
}
function getActionHandlers(store, handler) {
  return store.get('actions', (0, _immutable.Set)()).toMap().map(action => handler(action));
}

// The cursor logic is entirely functional, so this class simply
// provides a chainable interface
class Cursor {
  static create(...args) {
    return new Cursor(...args);
  }
  constructor(...args) {
    _defineProperty(this, "store", void 0);
    _defineProperty(this, "actions", void 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _defineProperty(this, "data", void 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _defineProperty(this, "meta", void 0);
    if (args[0] instanceof Cursor) {
      return args[0];
    }
    this.store = createCursorStore(...args);
    this.actions = this.store.get('actions');
    this.data = this.store.get('data');
    this.meta = this.store.get('meta');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateStore(...args) {
    return new Cursor(this.store.update(...args));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return this.updateStore(store => store.set('actions', (0, _immutable.Set)(actions)));
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
    return [this.store.get('data').delete('wrapped_cursor_data'), this.updateStore('data', data => data.get('wrapped_cursor_data'))];
  }
  clearData() {
    return this.updateStore('data', () => (0, _immutable.Map)());
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
exports.default = Cursor;
const CURSOR_COMPATIBILITY_SYMBOL = Symbol('cursor key for compatibility with old backends');
exports.CURSOR_COMPATIBILITY_SYMBOL = CURSOR_COMPATIBILITY_SYMBOL;