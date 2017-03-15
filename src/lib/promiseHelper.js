export const filterPromises = (arr, filter) =>
   Promise.all(arr.map(entry => filter(entry)))
     .then(bits => arr.filter(entry => bits.shift()));
