# Editorial Workflow

## Overview

By default, all entries created or edited in the Netlify CMS are committed directly into the main repository branch.

Alternatively, you can enable an optional "Editorial Workflow" mode that allows for more control over the content publishing phases. All unpublished entries will be arranged in a board according to their status, and they can be further reviewed and edited before going live.

![Editorial workflow](https://cloud.githubusercontent.com/assets/33676/19452442/d10d9002-948f-11e6-9463-06955b6c15c8.png)

From a technical perspective, the workflow translates editor UI actions into common Git commands:

Actions in Netlify UI...	| Perform these Git actions
--- | ---
Save draft | Commits to a new branch, and opens a pull request
Edit draft | Pushes another commit to the draft branch/pull request
Approve and publish draft | Merges pull request and deletes branch


## Adding to your site

To enable the editorial workflow, add this line to your `admin/config.yml` file:

``` yaml
publish_mode: editorial_workflow
```

There are no other configuration options right now. There are always three possible statuses, and new branch names are created according to the pattern `cms/collectionName-entrySlug`.


## About metadata

Netlify CMS embraces the idea of Git-as-backend for storing metadata. The first time it runs with the editorial_workflow setup, it creates a new ref called `meta/_netlify_cms`, pointing to an empty, orphan tree.

Actual data are stored in individual `json` files committed to this tree.


## Implementation

Instead of adding logic to `CollectionPage` and `EntryPage`, the Editorial Workflow is implemented as Higher Order Components, adding UI and dispatching additional actions.

Furthermore, all editorial workflow state is managed in Redux - there's an `actions/editorialWorkflow.js` and a `reducers/editorialWorkflow.js` files.
