import uuid from 'uuid';
import Immutable from 'immutable';
import { actions as notifActions } from 'redux-notifications';
import { closeEntry } from './editor';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { currentBackend } from '../backends/backend';
import { getAsset } from '../reducers';
import { loadEntry } from './entries';
import { status, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import { EditorialWorkflowError } from "../valueObjects/errors";

const { notifSend } = notifActions;

/*
 * Contant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
export const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';

export const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';

export const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
export const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
export const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';

export const UNPUBLISHED_ENTRY_REGISTER_DEPENDENCY = 'UNPUBLISHED_ENTRY_REGISTER_DEPENDENCY';
export const UNPUBLISHED_ENTRY_UNREGISTER_DEPENDENCY = 'UNPUBLISHED_ENTRY_UNREGISTER_DEPENDENCY';

export const UNPUBLISHED_ENTRY_DEPENDENCIES_REQUEST = 'UNPUBLISHED_ENTRY_DEPENDENCIES_REQUEST';
export const UNPUBLISHED_ENTRY_DEPENDENCIES_SUCCESS = 'UNPUBLISHED_ENTRY_DEPENDENCIES_SUCCESS';
export const UNPUBLISHED_ENTRY_DEPENDENCIES_FAILURE = 'UNPUBLISHED_ENTRY_DEPENDENCIES_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(collection, entry) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: { 
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST,
  };
}

function unpublishedEntriesLoaded(entries, pagination) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}


function unpublishedEntryPersisting(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPersisted(collection, entry, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: { 
      collection: collection.get('name'),
      entry,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPersistedFail(error, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: { error },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: { 
      collection,
      slug,
      oldStatus,
      newStatus,
    },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryStatusChangeError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryPublishRequest(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
    optimist: { type: BEGIN, id: transactionID },
  };
}

function unpublishedEntryPublished(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
    optimist: { type: COMMIT, id: transactionID },
  };
}

function unpublishedEntryPublishError(collection, slug, transactionID) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
    optimist: { type: REVERT, id: transactionID },
  };
}

function unpublishedEntryRegisterDependency(field, collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_REGISTER_DEPENDENCY,
    payload: { field, collection, slug },
  };
}

function unpublishedEntryUnregisterDependency(field) {
  return {
    type: UNPUBLISHED_ENTRY_UNREGISTER_DEPENDENCY,
    payload: { field },
  };
}

function unpublishedEntryDependenciesRequest(collection, slug) {
  return {
    type: UNPUBLISHED_ENTRY_DEPENDENCIES_REQUEST,
    payload: { collection, slug },
  };
}

function unpublishedEntryDependenciesSuccess(collection, slug, dependencies) {
  return {
    type: UNPUBLISHED_ENTRY_DEPENDENCIES_SUCCESS,
    payload: { collection, slug, dependencies },
  };
}

function unpublishedEntryDependenciesError(collection, slug, error) {
  return {
    type: UNPUBLISHED_ENTRY_DEPENDENCIES_FAILURE,
    payload: { collection, slug, error },
  };
}

/*
 * Exported Thunk Action Creators
 */

export const registerUnpublishedEntryDependency = unpublishedEntryRegisterDependency;
export const unregisterUnpublishedEntryDependency = unpublishedEntryUnregisterDependency;

export function loadUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryLoading(collection, slug));
    return backend.unpublishedEntry(collection, slug)
    .then(entry => dispatch(unpublishedEntryLoaded(collection, entry)))
    .catch((error) => {
      if (error instanceof EditorialWorkflowError && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(notifSend({
          message: `Error loading entry: ${ error }`,
          kind: 'danger',
          dismissAfter: 8000,
        }));
      }
    });
  };
}

export function loadUnpublishedEntries() {
  return (dispatch, getState) => {
    const state = getState();
    if (state.config.get('publish_mode') !== EDITORIAL_WORKFLOW) return;
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntriesLoading());
    backend.unpublishedEntries().then(
      response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)),
      error => dispatch(unpublishedEntriesFailed(error))
    );
  };
}

export function persistUnpublishedEntry(collection, existingUnpublishedEntry) {
  return (dispatch, getState) => {
    const state = getState();
    const entryDraft = state.entryDraft;

    // Early return if draft contains validation errors
    if (!entryDraft.get('fieldsErrors').isEmpty()) return;

    const backend = currentBackend(state.config);
    const assetProxies = entryDraft.get('mediaFiles').map(path => getAsset(state, path));
    const entry = entryDraft.get('entry');
    const transactionID = uuid.v4();

    dispatch(unpublishedEntryPersisting(collection, entry, transactionID));
    const persistAction = existingUnpublishedEntry ? backend.persistUnpublishedEntry : backend.persistEntry;
    persistAction.call(backend, state.config, collection, entryDraft, assetProxies.toJS())
    .then(() => {
      dispatch(notifSend({
        message: 'Entry saved',
        kind: 'success',
        dismissAfter: 4000,
      }));
      dispatch(closeEntry());
      dispatch(unpublishedEntryPersisted(collection, entry, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to persist entry: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      dispatch(unpublishedEntryPersistedFail(error, transactionID));
    });
  };
}

export function updateUnpublishedEntryStatus(collection, slug, oldStatus, newStatus) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug, oldStatus, newStatus, transactionID));
    backend.updateUnpublishedEntryStatus(collection, slug, newStatus)
    .then(() => {
      dispatch(unpublishedEntryStatusChangePersisted(collection, slug, oldStatus, newStatus, transactionID));
    })
    .catch(() => {
      dispatch(unpublishedEntryStatusChangeError(collection, slug, transactionID));
    });
  };
}

export function deleteUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID)); 
    backend.deleteUnpublishedEntry(collection, slug)
    .then(() => {
      dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to close PR: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      dispatch(unpublishedEntryPublishError(collection, slug, transactionID)); 
    });
  };
}

export function publishUnpublishedEntry(collection, slug) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const transactionID = uuid.v4();
    dispatch(unpublishedEntryPublishRequest(collection, slug, transactionID));
    backend.publishUnpublishedEntry(collection, slug)
    .then(() => {
      dispatch(unpublishedEntryPublished(collection, slug, transactionID));
    })
    .catch((error) => {
      dispatch(notifSend({
        message: `Failed to merge: ${ error }`,
        kind: 'danger',
        dismissAfter: 8000,
      }));
      dispatch(unpublishedEntryPublishError(collection, slug, transactionID));
    });
  };
}

const getDepsPath = dep => [
  "entities",
  dep,
  "metaData",
  "dependencies",
];

const getEventualDependencies = (paths, loadedDeps, state, dispatch) =>
   // Filter paths to remove those we've already checked. This
   // prevents traverse from loading posts we don't need or looping
   // infinitely over cyclic dependencies.
   paths.filter(path => !loadedDeps.includes(path)).map((path) => {
     const [pathCollectionName, pathSlug] = path.split(".");
     const pathCollection = state.collections.get(pathCollectionName);
     // Wait for the entry to load
     return dispatch(loadUnpublishedEntry(pathCollection, pathSlug))
     // Return the path at the end so we can use it in .thens later
       .then(() => path);
   });

const pathHasDependencies = (state, path) => {
  if (!state.editorialWorkflow.hasIn(path) ||
      state.editorialWorkflow.getIn(path) === null) {
    return false;
  }

  if (state.editorialWorkflow.getIn(path).size === 0) {
    return false;
  }

  return true;
};

const reducePromises = (promises, fn, initPromise) => {
  // If the array is empty and we aren't given an init value, we don't
  // have anything to return.
  if (promises.length === 0 && initPromise === undefined) {
    throw new Error("Reduce of empty promise array with no initial value.");
  }

  // If we weren't given an init value, then the init value should be
  // the first item in `promises`
  const [initValue, skipFirstPromise] = (initPromise !== undefined)
     ? [initPromise, false]
     : [promises[0], true];

  // If we are using the first promise as our init value, we need to
  // remove it from the promises we'll reduce over.
  const promisesToReduce = skipFirstPromise
     ? promises.slice(1)
     : promises;

  return promisesToReduce.reduce((accumulatedPromises, currentPromise) =>
      Promise.all([accumulatedPromises, currentPromise]).then(
        (([accumulated, current]) => fn(accumulated, current))),
    initValue);
};

const traverse = (collectedDeps, path, getState, dispatch) => {
  const state = getState();

  if (collectedDeps.get(path) === true) {
    return Promise.resolve(collectedDeps);
  }

  // Add this entry to the dependency list
  const newDeps = collectedDeps.set(path, true);
  const newDepsPromise = Promise.resolve(newDeps);

  // Get the full state path to this entries dependencies
  const depsPath = getDepsPath(path);

  // If the entry has no dependencies, return the collected dependency
  // list (including the current entry)
  if (!pathHasDependencies(state, depsPath)) {
    return newDepsPromise;
  }

  const theseDependencies = state.editorialWorkflow.getIn(depsPath);

  // Gets a list of promises for all unrecorded dependencies. Each
  // promise resolves once its entry is loaded.
  const eventualDeps = getEventualDependencies(theseDependencies, collectedDeps, state, dispatch);

  // Reduce over the list of dependency promises. allDepsPromise is
  // the accumulation value. Each time we reduce, we call traverse to
  // get the dependencies of the current dependency, then continue to
  // the next one. This makes traversal recurse until all the
  // dependencies are collected.
  return reducePromises(
    eventualDeps,
    (deps, dep) => traverse(deps, dep, getState, dispatch),
    newDepsPromise
  );
};

export function getUnpublishedEntryDependencies(collection, slug) {
  return (dispatch, getState) => {
    dispatch(unpublishedEntryDependenciesRequest(collection, slug));

    // Begin traversal
    return traverse(new Immutable.Map(), `${ collection }.${ slug }`, getState, dispatch)
      .then((dependencyMap) => {
        const state = getState();
        const dependencies = dependencyMap.keySeq().toList();

        // Remove any dependencies which are already published
        const filteredDependencies = dependencies.filter(
          dep => state.editorialWorkflow.hasIn(["entities", dep]));
        return dispatch(unpublishedEntryDependenciesSuccess(collection, slug, filteredDependencies));
      })
      .catch(err => dispatch(unpublishedEntryDependenciesError(collection, slug, err)));
  };
}
