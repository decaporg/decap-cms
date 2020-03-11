---
title: Architecture
position: 90
group: contributing
---

Netlify CMS is a React application, using Redux for state management with immutable data structures (immutable.js).

The core abstractions for content editing are `collections`, `entries`, and `widgets`.

Each `collection` represents a collection of entries. This can either be a collection of similar entries with the same structure, or a set of entries where each has its own structure.

The structure of an entry is defined as a series of fields, each with a `name`, a `label`, and a `widget`.

The `widget` determines the UI widget that the content editor will use when editing this field of an entry, as well as how the content of the field is presented in the editing preview.

Entries are loaded and persisted through a `backend` that will typically represent a `git` repository. 

## State shape / reducers
**Auth:** Keeps track of the logged state and the current user.

**Config:** Holds the environment configuration (backend type, available collections and fields).

**Collections:** List of available collections, their fields and metadata information.

**Entries:** Entries for each field.

**EntryDraft:** Reused for each entry that is edited or created. It holds the entry's temporary data until it's persisted on the backend.

## Selectors
Selectors are functions defined within reducers used to compute derived data from the Redux store. The available selectors are:

**selectEntry:** Selects a single entry, given the collection and a slug.

**selectEntries:** Selects all entries for a given collection.

**getAsset:** Selects a single AssetProxy object for the given path.

## Value Objects
**AssetProxy:** AssetProxy is a Value Object that holds information regarding an asset file (for example, an image), whether it's persisted online or held locally in cache.

For a file persisted online, the AssetProxy only keeps information about its URI. For local files, the AssetProxy will keep a reference to the actual File object while generating the expected final URIs and on-demand blobs for local preview.

The AssetProxy object can be used directly inside a media tag (such as `<img>`), as it will always return something that can be used by the media tag to render correctly (either the URI for the online file or a single-use blob).

## Components structure and Workflows
Components are separated into two main categories: Container components and Presentational components.

### Entry Editing
For either updating an existing entry or creating a new one, the `EntryEditor` is used and the flow is the same:

* When mounted, the `EntryPage` container component dispatches the `createDraft` action, setting the `entryDraft` state to a blank state (in case of a new entry) or to a copy of the selected entry (in case of an edit).
* The `EntryPage` will also render widgets for each field type in the given entry.
* Widgets are used for editing entry fields. There are different widgets for different field types, and they are always defined in a pair containing a `control` component and a `preview` component. The control component is responsible for presenting the user with the appropriate interface for manipulating the current field value. The preview component is responsible for displaying the value with the appropriate styling.

#### Widget components implementation
The control component receives one (1) callback as a prop: `onChange`.

* onChange (required): Should be called when the users changes the current value. It will ultimately end up updating the EntryDraft object in the Redux Store, thus updating the preview component.
* onAddAsset & onRemoveAsset (optionals): Should be invoked with an `AssetProxy` value object if the field accepts file uploads for media (images, for example). `onAddAsset` will get the current media stored in the Redux state tree while `onRemoveAsset` will remove it. AssetProxy objects are stored in the `Medias` object and referenced in the `EntryDraft` object on the state tree.

Both control and preview widgets receive a `getAsset` selector via props. Displaying the media (or its URI) for the user should always be done via `getAsset`, as it returns an AssetProxy that can return the correct value for both medias already persisted on the server and cached media not yet uploaded.

The actual persistence of the content and medias inserted into the control component is delegated to the backend implementation. The backend will be called with the updated values and a list of assetProxy objects for each field of the entry, and should return a promise that can resolve into the persisted entry object and the list of the persisted media URIs.


## Editorial Workflow implementation

Instead of adding logic to `CollectionPage` and `EntryPage`, the Editorial Workflow is implemented as Higher Order Components, adding UI and dispatching additional actions.

Furthermore, all editorial workflow state is managed in Redux - there's an `actions/editorialWorkflow.js` file and a `reducers/editorialWorkflow.js` file.

### About metadata

Netlify CMS embraces the idea of Git-as-backend for storing metadata. The first time it runs with the `editorial_workflow` setup, it creates a new ref called `meta/_netlify_cms`, pointing to an empty, orphan tree.

Actual data are stored in individual `json` files committed to this tree.
