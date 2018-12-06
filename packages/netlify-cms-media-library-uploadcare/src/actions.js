import { bindActionCreators } from 'redux';

export const UPLOADCARE_ADD_FILE = 'UPLOADCARE_ADD_FILE';
export const UPLOADCARE_REMOVE_FILES = 'UPLOADCARE_REMOVE_FILES';
export const UPLOADCARE_FLUSH = 'UPLOADCARE_FLUSH';
export const UPLOADCARE_LOAD = 'UPLOADCARE_LOAD';

async function files2index(files) {
  const jsonString = JSON.stringify(files.toJSON());
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

export function createActions(store, mediaLibraryActions) {
  function flushChanges() {
    return async (dispatch, getState) => {
      const files = getState().uploadcare.get('files');
      const indexFile = await files2index(files);
      const existingIndexFile = getState()
        .mediaLibrary.get('files')
        .find(existingFile => existingFile.name === indexFile.name);

      if (existingIndexFile) {
        await mediaLibraryActions.deleteMedia(existingIndexFile);
      }

      await mediaLibraryActions.persistMedia(indexFile);

      return dispatch({
        type: UPLOADCARE_FLUSH,
      });
    };
  }

  function loadFiles() {
    return async (dispatch, getState) => {
      await mediaLibraryActions.loadMedia();

      const indexName = 'uploadcare-index.json';

      const netlifyFile = getState()
        .mediaLibrary.get('files')
        .find(file => file.name === indexName);

      const blob = await fetch(netlifyFile.url).then(resp => resp.blob());
      const indexFile = new File([blob], indexName);
      const files = await index2files(indexFile);

      return dispatch({
        type: UPLOADCARE_LOAD,
        payload: {
          files,
        },
      });
    };
  }

  function addFile(fileInfo) {
    return async (dispatch, getState) => {
      await dispatch({
        type: UPLOADCARE_ADD_FILE,
        payload: {
          fileInfo,
          uuid: fileInfo.uuid,
        },
      });

      if (getState().uploadcare.get('dirty')) {
        return dispatch(flushChanges());
      }
    };
  }

  function removeFiles(uuids) {
    return async dispatch => {
      await dispatch({
        type: UPLOADCARE_REMOVE_FILES,
        payload: {
          uuids,
        },
      });

      return dispatch(flushChanges());
    };
  }

  return bindActionCreators(
    {
      loadFiles,
      addFile,
      removeFiles,
    },
    store.dispatch,
  );
}
