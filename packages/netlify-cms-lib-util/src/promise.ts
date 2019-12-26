import flow from 'lodash/flow';

export const then = <T, V>(fn: (r: T) => V) => (p: Promise<T>) => Promise.resolve(p).then(fn);

const filterPromiseSymbol = Symbol('filterPromiseSymbol');

export const onlySuccessfulPromises = (promises: Promise<unknown>[]) => {
  return Promise.all(promises.map(p => p.catch(() => filterPromiseSymbol))).then(results =>
    results.filter(result => result !== filterPromiseSymbol),
  );
};

const wrapFlowAsync = (fn: Function) => async (arg: unknown) => fn(await arg);
export const flowAsync = (fns: Function[]) => flow(fns.map(fn => wrapFlowAsync(fn)));
