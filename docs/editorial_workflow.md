# Editorial Workflow

## Overview

The Netlify CMS has an optional "Editorial Workflow" mode that let's allows for more control over the content publishing phases.

By default, all entries created or edited in the Netlify CMS are committed directly into the main repository branch  - which means your live site will be updated (that is, assuming your site is hosted on Netlify or you have your own continuous deployment setup).

With the Editorial Workflow configured, entries can have a 'Draft', 'Waiting for Review' or 'Waiting to go live' status.

This works transparently from the CMS user perspective. All unpublished entries will be arranged in a board according to their status, and they can be further reviewed and edited before going live.

![Editorial-workflow](https://cloud.githubusercontent.com/assets/33676/19452442/d10d9002-948f-11e6-9463-06955b6c15c8.png)

From a technical perspective, this means that instead of publishing a new or edited entry directly into the default repository branch, Netlify CMS will:

* Create a new Branch before committing the new/changed files.
* Save some metadata information regarding the new entry.
* Open a Pull Request to merge the edited content.

Once on "Waiting to go live", a merge into the main branch can be triggered directly from the Netlify CMS UI.


## Configuring Editorial Workflow on your site.

Just add `publish_mode: editorial_workflow` in your config.yaml file. For example:

```yaml
backend:
  name: github
  repo: repo/mysite

publish_mode: editorial_workflow

collections:
  - name: articles
    label: "Articles" # Used in the UI, ie.: "New Post"
    # etc (Omitted for brevity)
```

There are no other configuration options right now: There are always three possible status, and the new branches names are created according to the pattern `cms/collectionName-entrySlug`.


## About metadata

Netlify CMS embraces the idea of GIT-as-backend for storing metadata. The first time it runs with the editorial_workflow setup, it creates a new ref called `meta/_netlify_cms`, pointing to an empty, orphan tree.

Actual data are stored in individual `json` files committed to this three.


## Implementation

Instead of adding logic to `CollectionPage` and `EntryPage`, the Editorial Workflow is implemented as Higher Order Components, adding UI and dispatching additional actions.

Furthermore, all editorial workflow state is managed in Redux - there's an `actions/editorialWorkflow.js` and a `reducers/editorialWorkflow.js` files.
