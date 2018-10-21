import { persistMedia, loadMedia, deleteMedia } from 'netlify-cms-core/src/actions/mediaLibrary';

export const UPLOADCARE_ADD_FILE = 'UPLOADCARE_ADD_FILE';
export const UPLOADCARE_PERSIST = 'UPLOADCARE_PERSIST';
export const UPLOADCARE_LOAD = 'UPLOADCARE_LOAD';

async function files2index(files) {
  const jsonString = JSON.stringify(files.toJS());
  const file = new File([jsonString], 'uploadcare-index.json', {
    type: 'application/json',
    lastModified: new Date(),
  });

  return file;
}

function index2files(indexFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = JSON.parse(reader.result);

      resolve(result);
    };

    reader.onerror = err => {
      reject(err);
    };

    reader.readAsText(indexFile);
  });
}

export function persistFiles() {
  return async (dispatch, getState) => {
    const state = getState();
    const files = state.uploadcare.get('files');
    const indexFile = await files2index(files);
    const existingIndexFile = state.mediaLibrary
      .get('files')
      .find(existingFile => existingFile.name === indexFile.name);

    if (existingIndexFile) {
      await dispatch(deleteMedia(existingIndexFile));
    }

    await dispatch(persistMedia(indexFile));

    return dispatch({
      type: UPLOADCARE_PERSIST,
    });
  };
}

export function loadFiles() {
  return async (dispatch, getState) => {
    await dispatch(loadMedia());

    const indexName = 'uploadcare-index.json';

    const netlifyFile = getState()
      .mediaLibrary.get('files')
      .find(file => file.name === indexName);

    const blob = await fetch(netlifyFile.url).then(resp => resp.blob());
    const indexFile = new File([blob], indexName);
    const files = await index2files(indexFile);

    return dispatch({
      type: UPLOADCARE_LOAD,
      payload: { files },
    });
  };
}

export function addFile(fileInfo) {
  return async dispatch => {
    return dispatch({
      type: UPLOADCARE_ADD_FILE,
      payload: {
        fileInfo,
      },
    });
  };
}
