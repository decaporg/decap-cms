import flow from 'lodash/flow';

export function then<T, V>(fn: (r: T) => V) {
  return (p: Promise<T>) => Promise.resolve(p).then(fn);
}

const filterPromiseSymbol = Symbol('filterPromiseSymbol');

export function onlySuccessfulPromises(promises: Promise<unknown>[]) {
  return Promise.all(promises.map(p => p.catch(() => filterPromiseSymbol))).then(results =>
    results.filter(result => result !== filterPromiseSymbol),
  );
}

function wrapFlowAsync(fn: Function) {
  return async (arg: unknown) => fn(await arg);
}

export function flowAsync(fns: Function[]) {
  return flow(fns.map(fn => wrapFlowAsync(fn)));
}
