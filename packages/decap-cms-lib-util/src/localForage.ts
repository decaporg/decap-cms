import localForage from 'localforage';

function localForageTest() {
  const testKey = 'localForageTest';
  localForage
    .setItem(testKey, { expires: Date.now() + 300000 })
    .then(() => {
      localForage.removeItem(testKey);
    })
    .catch(err => {
      if (err.code === 22) {
        const message = 'Unable to set localStorage key. Quota exceeded! Full disk?';
        console.warn(message);
      }
      console.log(err);
    });
}

localForageTest();

export default localForage;
