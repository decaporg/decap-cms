import { zipObject } from 'lodash';

export const filterPromises = (arr, filter) =>
   Promise.all(arr.map(entry => filter(entry)))
     .then(bits => arr.filter(entry => bits.shift()));

export const resolvePromiseProperties = (obj) => {
  // Get the keys which represent promises
  const promiseKeys = Object.keys(obj).filter(
    key => typeof obj[key].then === "function");

  const promises = promiseKeys.map(key => obj[key]);

  // Resolve all promises
  return Promise.all(promises)
  .then(resolvedPromises =>
    // Return a copy of obj with promises overwritten by their
    // resolved values
    Object.assign({}, obj, zipObject(promiseKeys, resolvedPromises)));
};

export const then = fn => p => Promise.resolve(p).then(fn);
