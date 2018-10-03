import { OrderedMap } from 'immutable';

/**
 * Creates function which returns current index object from state
 * If no one, creates new empty object
 *
 * @export
 * @param {*} getState
 * @returns
 */
export function makeIndexGetter(getState) {
  const filename = 'uploadcare-index.json';

  return async () => {
    const netlifyFile = getState()
      .mediaLibrary.get('files')
      .find(file => file.name === filename);

    if (!netlifyFile) {
      const indexObj = createIndex();

      return indexObj;
    }

    const blob = await fetch(netlifyFile.url).then(resp => resp.blob());
    const fileObj = new File([blob], filename);
    const indexObj = await file2index(fileObj);

    return indexObj;
  };
}

/**
 * Save index object to the state via calling persist action
 *
 * @export
 * @param {*} handlePersist
 * @returns
 */
export function makeIndexApplier(handlePersist) {
  return async indexObj => {
    const fileObj = await index2file(indexObj);

    return handlePersist(fileObj);
  };
}

function createIndex() {
  return OrderedMap({});
}

async function index2file(index) {
  const jsonString = JSON.stringify(index.toJS());
  const file = new File([jsonString], 'uploadcare-index.json', {
    type: 'application/json',
    lastModified: new Date(),
  });

  return file;
}

function file2index(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = OrderedMap(JSON.parse(reader.result));

      resolve(result);
    };

    reader.onerror = err => {
      reject(err);
    };

    reader.readAsText(file);
  });
}
