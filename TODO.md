# TODO:

This is a fairly rambling TODO list listing features that we should have and some small issues we should work on.

Based on this we can start working on a more detailed roadmap and turn some larger features into RFCs for discussions.

## Image widget:

The image widget has a few things missing. Mainly being able to see the image file name and
removing the image.

Here's a UI mockup:

![Image widget](/todo/image-field.png)

At some point in the future more advanced options like a media browser + image editing tools like crops and resizing would be great to have as well. Short term, just being able to remove an image from a post is the most important.

## File widget

A file upload widget. Should be very similar to the image widget.

## Gallery widget:

Like the image field, but for a bunch of images that can be reordered, etc.

The list widget with an image widget can do the trick, but galleries are so common that it would
be great to have a robust ui for it.

## Media Files

Make the media file store upload async in the background when a file is added. Right now all media files that haven't been uploaded yet gets passed to the repository when the entry is saved. Would be much better to just have them upload in the background as soon as they're added. They would simply be prepared as "blobs" in the backend, and then included in the commit tree.

## Delete Entries

We currently don't have any way to remove entries, only adding them.

Something like this (see draft functionality as well) would be good:

![Delete and draft functionality](/todo/delete-and-draft.png)

## Draft functionality

Support saving drafts. Might be simply based on a boolean property in documents. Not all collections/static gens will support this, so needs to be configurable.

Some support a 'draft' flag that'll hide a post in the production environmnet, middleman has a 'published' flag that works the other way around (and that's true by default). We'll need to support both, without making configuration clunky...

Jekyll has the strangest draft behavior currently. Only works for the \_posts collection and is based on keeping drafts in a separate folder called \_drafts. That makes listing posts, etc, tricky, since it requrires looking in two different folders... Lets not try to support this from the get-go...

## List field:

Better UI for reordering, work on stability, make items collapsible? Current list field works, but it's simple and the reordering doesn't feel super robust. Would be good to give it an overhaul.

## Formats

Make fromFile and toFile return a promise, so formats can do async operations.

This would be useful for a jade or html format that's based on a template and needs to
load that template first to do substitution, etc...

For example, in the roots documentation site each article looks something like this:

```jade
extends ../views/single_layout

block content
  h3 Title of the article

  :markdown
    Body of the article
```

So ideally the jade format would be able to use some kind of template and parse too and from this structure, but that would require reading the template for the repo (since keeping it in the config.yml seems a bit unvieldy).

The alternative is to just stick to formats that doesn't mix content and presentation.

## Preview Pane scroll behavior

The scroll behavior in the preview pane can sometimes be finicky - would be great to do a deep dive into this,
and get it rock solid.


## Single Documents

Right now netlify CMS only works on collections of documents. We should have the options to work on single documents as well, like Jekyll data files, Roots records, etc, etc...

We'll need a configuration format for this, and figure out format support....

## Relations

We need widgets for relations. At first just a simple one-to-one widget between collections would do wonders. It can always be combined with a list widget to create one-to-many relations.

Requires UI, and also requires moving the current logic for listing all entries in a collection out of the list controller and into the collection model.

## Navigations

Not sure if we need any distinction or if the combination of single documents + relations is enough. Ideally
it is. But a common need for a single document is arranging entries for a menu.

See:

https://github.com/jekyll/jekyll/blob/master/site/_data/docs.yml

## Authors & Profiles

There's no convention to speak of here across different sites built with static site generators, so this is not a totally straight forward thing to solve.

Might be as simple as being able to specify an authors document in the configuration file, something like:

authors:
  path: data/authors.json
  fields:
    - {label: "Name", name: "name", widget: "string"}
    - {label: "Biography", name: "bio", widget: "markdown"}

And then add a link in the profile dropdown that would let authors edit their own bio (as identified by a username the backend would need to supply...)

## Environments

Often you'll want to use the netlify-git-api backend when working locally, and switch to the github-api backend for production builds.

One way is to generate the config.yml from the static site generator, but that seems a bit clumsy.

Would be better to be able to do something like this:

```yml
backend:
  name: netlify-api
  url: localhost:8080

production:
  backend:
    name: github-api
    repo: owner/repo

collections:
  ...
```

Then setting a global `CMS_ENV` variable would make the config loader do something like:

```js
if (CMS_ENV) {
  $.extend(config, config[CMS_ENV], true)
}
```

To make sure the specific environment takes precedence over the default settings.

## Starter Sites

Right now getting started with netlify CMS requires quite a bit of work. Would be great to have at least templates for Roots, Middleman, Hugo and Jekyll, that'll work with the netlify-git-api. That way it's just a git clone and you're set...
