import { zipObject } from 'lodash';

export const filterPromises = (arr, filter) =>
   Promise.all(arr.map(entry => filter(entry)))
     .then(bits => arr.filter(entry => bits.shift()));

export const resolvePromiseProperties = obj =>
  (new Promise((resolve, reject) => {
    // Get the keys which represent promises
    const promiseKeys = Object.keys(obj).filter(
      key => obj[key] instanceof Promise);

    const promises = promiseKeys.map(key => obj[key]);

    // Resolve all promises
    Promise.all(promises)
      .then(resolvedPromises => resolve(
        // Return a copy of obj with promises overwritten by their
        // resolved values
        Object.assign(obj, zipObject(promiseKeys, resolvedPromises))))
      // Pass errors to outer promise chain
      .catch(err => reject(err));
  }));
