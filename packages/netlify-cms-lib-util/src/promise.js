import constant from 'lodash/constant';
import filter from 'lodash/fp/filter';
import map from 'lodash/fp/map';
import flow from 'lodash/flow';
import zipObject from 'lodash/zipObject';

export const filterPromises = (arr, filter) =>
  Promise.all(arr.map(entry => Promise.resolve(entry).then(filter))).then(bits =>
    arr.filter(() => bits.shift()),
  );

export const filterPromisesWith = filter => arr => filterPromises(arr, filter);

export const resolvePromiseProperties = obj => {
  // Get the keys which represent promises
  const promiseKeys = Object.keys(obj).filter(key => typeof obj[key].then === 'function');

  const promises = promiseKeys.map(key => obj[key]);

  // Resolve all promises
  return Promise.all(promises).then(resolvedPromises =>
    // Return a copy of obj with promises overwritten by their
    // resolved values
    Object.assign({}, obj, zipObject(promiseKeys, resolvedPromises)),
  );
};

export const then = fn => p => Promise.resolve(p).then(fn);

const filterPromiseSymbol = Symbol('filterPromiseSymbol');
export const onlySuccessfulPromises = flow([
  then(map(p => p.catch(constant(filterPromiseSymbol)))),
  then(Promise.all.bind(Promise)),
  then(filter(maybeValue => maybeValue !== filterPromiseSymbol)),
]);
