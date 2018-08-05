---
title: Creating a CMS Backend
weight: 30
group: reference
---

Netlify CMS exposes a `window.CMS` global object that you can use to register custom backends. The same object is also the default export if you import Netify CMS as an npm module. The available backend extension methods are:

* **registerBackend:** lets you register a custom backend. The CMS expects you to pass it an ES6 `class` or other object which it can call `new BackendClass()` on.

### Example Usage:
```js
CMS.registerBackend('my-backend', MyBackendClass);
```

**Following are the methods the CMS expects to see on your backend class. Currently they are very Git-centric and assume the backend is aware of the general flow of CMS internals, but this will be changing as a new API is rolled out.**

## `constructor`
Set up backend class based on user configuration.

`constructor(config, { useWorkflow, updateUserCredentials, initialWorkflowStatus })`
- `config` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): entire CMS config file
- `useWorkflow` (boolean): if editorial workflow is enabled
- `updateUserCredentials` (function): updates cached credentials (if user data or token is updated)
- `initialWorkflowStatus` (constant): editorial workflow status for new posts

## `authComponent`
Return a login screen for the user to authenticate with the backend.

`authComponent()`
- *returns* a React Component: a login screen

## `authenticate`
Authenticate the user with credentials from the login screen. If it is successful, the returned user data will be cached locally until the user logs outof the CMS. Closing the browser does *not* implicitly log the user out. If you do not want the CMS to cache user data for your backend, you can choose not to return credentials along with the user metadata.

`authenticate(credentials)`
- `credentials`: credentials returned from login screen (see `authComponent`)
- *returns* a Promise:
  - if the user's credentials are valid and the user has write access to the backend the CMS is configured to access, a resolved Promise containing user metadata (e.g. name, avatar) and credentials (that were passed in)
  - otherwise a rejected Promise containing the reason for rejection
  
## `restoreUser`
Authenticate the user with cached user data (see `authenticate`).

`restoreUser(user)`
- `user`: user data returned from `authenticate`
- *returns* a Promise: (same return expected as for `authenticate`)

## `logout`
Forget user credentials. The CMS handles the cache seperately.

`logout()`

## `getToken`
Returns user credentials. This token will be passed to integrations?

`getToken()`
- *returns* a Promise: resolving with user credentials

## `traverseCursor`

## `entriesByFolder`
## `allEntriesByFolder`
Returns contents of entries in a folder-type collection which have a specific file extension.

`entriesByFolder(collection, extension)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `extension` (string): files with other extensions should be filtered out
- *returns* a Promise: resolving with an array of files (like Promise.all). If the array is paginated and does not contain every file, the array should contain an cursor (see `traverseCursor`). Files should be objects with the following keys:
  - `file` (object): file metadata (at least `path`)
  - `data`: (string): raw file content parsed as a [Unicode string](https://developer.mozilla.org/en-US/docs/Web/API/USVString)

## `entriesByFiles`
Returns contents of all entries in a file-type collection.

`entriesByFiles(collection)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): (see `entriesByFolder`)
- *returns* a Promise: (see `entriesByFolder`)

## `getEntry`
Get the contents of a single entry.

`getEntry(collection, slug, path)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `slug` (string): entry slug (filename without extension)
- `path` (string): file path (see *returns* for `entriesByFolder`)
- *returns* a Promise: resolving to an object in a `{ file, data }` format where `file` consists of file metadata (at least the file path), and `data` is the raw file content parsed as a [Unicode string](https://developer.mozilla.org/en-US/docs/Web/API/USVString).

## `getMedia`
Return the contents of the `media_folder` from the config.

`getMedia()`
- *returns* a Promise: resolving with an array of media (like Promise.all). Media should be an object with the following keys:
  - `id` (string): A unique key for the media file (a SHA is often appropriate)
  - `name` (string): media file name
  - `path` (string): media file path
  - either `url` or `getBlobPromise`:
    - `url` (string): URL to a thumbnail of the media, if available
    - `getBlobPromise` (function): returns a Promise with resolves to a thumbnail of the, if available, in a [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) format
    
## `persistEntry`
Save a copy of the entry.

`persistEntry(entry, mediaFiles, { newEntry, parsedData, collectionName, useWorkflow, commitMessage, hasAssetStore })`
- `entry` (object):
  - `raw` (string): entry content
  - `path` (string): file path to entry
- *deprecated in v0.7.0* ~~`mediaFiles` (array): a list of media files uploaded to this entry~~
- `newEntry` (boolean): this is a newly created entry
- `parsedData` (object): `title` and `description` parsed from raw entry content, if possible
- `collectionName` (string): `name` of collection from config
- `useWorkflow` (boolean): if Editorial Workflow is enabled, save draft -- do not publish directly
- `commitMessage` (string): Git commit message, if publishing entry directly.
- `hasAssetStore` (boolean): if assets are being stored in a separate integration (instead of in the backend)
- *returns* a Promise which resolves if persisting was successful

## `persistMedia`
Save a copy of a media file.

`persistMedia(mediaFile, { commitMessage })`
- `mediaFile` (AssetProxy)
- `commitMessage` (string): Git commit message, if publishing entry directly.
- *returns* a Promise which resolves if persisting was successful

## `deleteFile`
Delete an entry or media file.

`deleteFile(path, commitMessage)`
- `path` (string): file path
- `commitMessage` (string): Git commit message.
- *returns* a Promise which resolves if deletion was successful

## `unpublishedEntries`
Returns content of unpublished entries.

`unpublishedEntries()`
- *returns* a Promise: resolving with an array of files (like Promise.all). Files should be objects with the following keys:
  - `slug` (string): entry slug (filename without extension)
  - `file` (object): file metadata (at least `path`)
  - `metaData` (object): Editoral Workflow metadata (e.g. pull request)
  - `data` (string): raw file content parsed as a [Unicode string](https://developer.mozilla.org/en-US/docs/Web/API/USVString)
  - `isModification` (boolean): if a published version of this entry exists

## `unpublishedEntry`
Returns content of an unpublished entry.

`unpublishedEntries(collection, slug)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `slug` (string): entry slug (filename without extension)
- *returns* a Promise: resolving with an array of files (like Promise.all). Files should be objects with the following keys:
  - `slug` (string): entry slug (filename without extension)
  - `file` (object): file metadata (at least `path`)
  - `metaData` (object): Editoral Workflow metadata (e.g. pull request)
  - `data` (string): raw file content parsed as a [Unicode string](https://developer.mozilla.org/en-US/docs/Web/API/USVString)
  - `isModification` (boolean): if a published version of this entry exists

## `updateUnpublishedEntryStatus`
Update status marker on unpublished entry.

`updateUnpublishedEntryStatus(collection, slug, newStatus)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `slug` (string): entry slug (filename without extension)
- `newStatus` (constant): status to apply to entry metadata
- *returns* a Promise: which resolves if status is updated successfully

## `publishUnpublishedEntry`
Publish an Editorial Workflow draft entry.

`publishUnpublishedEntry(collection, slug)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `slug` (string): entry slug (filename without extension)
- *returns* a Promise: which resolves if entry is published successfully

## `deleteUnpublishedEntry`
Delete an Editorial Workflow draft entry. This does not affect any content which is already published.

`deleteUnpublishedEntry(collection, slug)`
- `collection` ([`Map`](https://facebook.github.io/immutable-js/docs/#/Map)): collection configuration from config file
- `slug` (string): entry slug (filename without extension)
- *returns* a Promise: which resolves if entry is deleted successfully