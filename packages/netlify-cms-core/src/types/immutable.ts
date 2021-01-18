export interface StaticallyTypedRecord<T> {
  get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K];
  set<K extends keyof T, V extends T[K]>(key: K, value: V): StaticallyTypedRecord<T> & T;
  has<K extends keyof T>(key: K): boolean;
  delete<K extends keyof T>(key: K): StaticallyTypedRecord<T>;
  getIn<K1 extends keyof T, K2 extends keyof T[K1], V extends T[K1][K2]>(
    keys: [K1, K2],
    defaultValue?: V,
  ): T[K1][K2];
  getIn<
    K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    V extends T[K1][K2][K3]
  >(
    keys: [K1, K2, K3],
    defaultValue?: V,
  ): T[K1][K2][K3];
  getIn(keys: string[]): unknown;
  setIn<K1 extends keyof T, K2 extends keyof T[K1], V extends T[K1][K2]>(
    keys: [K1, K2],
    value: V,
  ): StaticallyTypedRecord<T>;
  setIn(keys: string[], value: unknown): StaticallyTypedRecord<T> & T;
  toJS(): T;
  isEmpty(): boolean;
  some<K extends keyof T>(predicate: (value: T[K], key: K, iter: this) => boolean): boolean;
  mapKeys<K extends keyof T, V>(mapFunc: (key: K, value: StaticallyTypedRecord<T>) => V): V[];
  find<K extends keyof T>(findFunc: (value: T[K]) => boolean): T[K];
  filter<K extends keyof T>(
    predicate: (value: T[K], key: K, iter: this) => boolean,
  ): StaticallyTypedRecord<T>;
  valueSeq<K extends keyof T>(): T[K][] & { toArray: () => T[K][] };
  map<K extends keyof T, V>(
    mapFunc: (value: T[K]) => V,
  ): StaticallyTypedRecord<{ [key: string]: V }>;
  keySeq<K extends keyof T>(): { toArray: () => K[] };
  withMutations(mutator: (mutable: StaticallyTypedRecord<T>) => unknown): StaticallyTypedRecord<T>;
}
