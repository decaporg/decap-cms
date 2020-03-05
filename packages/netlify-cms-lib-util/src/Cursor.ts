import { fromJS, Map, Set } from 'immutable';

type CursorStoreObject = {
  actions: Set<string>;
  data: Map<string, unknown>;
  meta: Map<string, unknown>;
};

export type CursorStore = {
  get<K extends keyof CursorStoreObject>(
    key: K,
    defaultValue?: CursorStoreObject[K],
  ): CursorStoreObject[K];
  getIn<V>(path: string[]): V;
  set<K extends keyof CursorStoreObject, V extends CursorStoreObject[K]>(
    key: K,
    value: V,
  ): CursorStoreObject[K];
  setIn(path: string[], value: unknown): CursorStore;
  hasIn(path: string[]): boolean;
  mergeIn(path: string[], value: unknown): CursorStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (...args: any[]) => CursorStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateIn: (...args: any[]) => CursorStore;
};

type ActionHandler = (action: string) => unknown;

const jsToMap = (obj: {}) => {
  if (obj === undefined) {
    return Map();
  }
  const immutableObj = fromJS(obj);
  if (!Map.isMap(immutableObj)) {
    throw new Error('Object must be equivalent to a Map.');
  }
  return immutableObj;
};

const knownMetaKeys = Set([
  'index',
  'page',
  'count',
  'pageSize',
  'pageCount',
  'usingOldPaginationAPI',
  'extension',
  'folder',
  'depth',
]);
const filterUnknownMetaKeys = (meta: Map<string, string>) =>
  meta.filter((_v, k) => knownMetaKeys.has(k as string));

/*
  createCursorMap takes one of three signatures:
  - () -> cursor with empty actions, data, and meta
  - (cursorMap: <object/Map with optional actions, data, and meta keys>) -> cursor
  - (actions: <array/List>, data: <object/Map>, meta: <optional object/Map>) -> cursor
*/
const createCursorStore = (...args: {}[]) => {
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
  }) as CursorStore;
};

const hasAction = (store: CursorStore, action: string) => store.hasIn(['actions', action]);

const getActionHandlers = (store: CursorStore, handler: ActionHandler) =>
  store
    .get('actions', Set<string>())
    .toMap()
    .map(action => handler(action as string));

// The cursor logic is entirely functional, so this class simply
// provides a chainable interface
export default class Cursor {
  store?: CursorStore;
  actions?: Set<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Map<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Map<string, any>;

  static create(...args: {}[]) {
    return new Cursor(...args);
  }

  constructor(...args: {}[]) {
    if (args[0] instanceof Cursor) {
      return args[0] as Cursor;
    }

    this.store = createCursorStore(...args);
    this.actions = this.store.get('actions');
    this.data = this.store.get('data');
    this.meta = this.store.get('meta');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateStore(...args: any[]) {
    return new Cursor(this.store!.update(...args));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateInStore(...args: any[]) {
    return new Cursor(this.store!.updateIn(...args));
  }

  hasAction(action: string) {
    return hasAction(this.store!, action);
  }
  addAction(action: string) {
    return this.updateStore('actions', (actions: Set<string>) => actions.add(action));
  }
  removeAction(action: string) {
    return this.updateStore('actions', (actions: Set<string>) => actions.delete(action));
  }
  setActions(actions: Iterable<string>) {
    return this.updateStore((store: CursorStore) => store.set('actions', Set<string>(actions)));
  }
  mergeActions(actions: Set<string>) {
    return this.updateStore('actions', (oldActions: Set<string>) => oldActions.union(actions));
  }
  getActionHandlers(handler: ActionHandler) {
    return getActionHandlers(this.store!, handler);
  }

  setData(data: {}) {
    return new Cursor(this.store!.set('data', jsToMap(data)));
  }
  mergeData(data: {}) {
    return new Cursor(this.store!.mergeIn(['data'], jsToMap(data)));
  }
  wrapData(data: {}) {
    return this.updateStore('data', (oldData: Map<string, unknown>) =>
      jsToMap(data).set('wrapped_cursor_data', oldData),
    );
  }
  unwrapData() {
    return [
      this.store!.get('data').delete('wrapped_cursor_data'),
      this.updateStore('data', (data: Map<string, unknown>) => data.get('wrapped_cursor_data')),
    ] as [Map<string, unknown>, Cursor];
  }
  clearData() {
    return this.updateStore('data', () => Map());
  }

  setMeta(meta: {}) {
    return this.updateStore((store: CursorStore) => store.set('meta', jsToMap(meta)));
  }
  mergeMeta(meta: {}) {
    return this.updateStore((store: CursorStore) =>
      store.update('meta', (oldMeta: Map<string, unknown>) => oldMeta.merge(jsToMap(meta))),
    );
  }
}

// This is a temporary hack to allow cursors to be added to the
// interface between backend.js and backends without modifying old
// backends at all. This should be removed in favor of wrapping old
// backends with a compatibility layer, as part of the backend API
// refactor.
export const CURSOR_COMPATIBILITY_SYMBOL = Symbol('cursor key for compatibility with old backends');
