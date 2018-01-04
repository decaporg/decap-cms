import LocalForage from "localforage";

function LocalForageTest() {
  const testKey = 'LocalForageTest';
  LocalForage.setItem(testKey, {expires: Date.now() + 300000}).then(() => {
    LocalForage.removeItem(testKey);
  }).catch((err) => {
    if (err.code === 22) {
      const message = `Uable to set localStorage key. Quota exceeded! Full disk?`;
      return alert(`${message}\n\n${err}`);
    }
    console.log(err);
  })
}

LocalForageTest();

export default LocalForage;
