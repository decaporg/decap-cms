# TODO:

This is a fairly rambling TODO list listing features that we should have and some small issues we should work on.

Based on this we can start working on a more detailed roadmap and turn some larger features into RFCs for discussions.

## Rich Text editor

It would be good to have a rich text widget. Ideally one that can edit markdown as rich text.

The best candidate for rich text editing right now is the newly released [ProseMirror](http://prosemirror.net/). It's still a very young project, but it's the only rich text editor that doesn't depend on editing HTML directly through contentEditable, but works with structured content through a completely custom built editing UI.

## Error Messages / Validation

The current validation system is not very user friendly. We should make sure widgets can show a clear validation message when loosing focus if they're in an invalid state. Since we also have hidden meta data in the sidebar that can be invalid and block a save, something like what Ghost does with a infobox explaining the error, would probably work for us as well.

## File widget

A file upload widget. Should be very similar to the image widget.

## Gallery widget:

Like the image field, but for a bunch of images that can be reordered, etc.

The list widget with an image widget can do the trick, but galleries are so common that it would
be great to have a robust ui for it.

## Media Files

Make the media file store upload async in the background when a file is added. Right now all media files that haven't been uploaded yet gets passed to the repository when the entry is saved. Would be much better to just have them upload in the background as soon as they're added. They would simply be prepared as "blobs" in the backend, and then included in the commit tree.

## Draft functionality

Support saving drafts. Might be simply based on a boolean property in documents. Not all collections/static gens will support this, so needs to be configurable.

Some support a 'draft' flag that'll hide a post in the production environmnet, middleman has a 'published' flag that works the other way around (and that's true by default). We'll need to support both, without making configuration clunky...

Jekyll has the strangest draft behavior currently. Only works for the \_posts collection and is based on keeping drafts in a separate folder called \_drafts. That makes listing posts, etc, tricky, since it requrires looking in two different folders... Lets not try to support this from the get-go...

## Help texts

It should be possible to add help texts to fields with a bit of extra information. Some of these might be small inline help texts defined directly in the config.yml, while others might be templates with more information.

Here's an example of what the end result should be like:

![Help Text](/todo/help-text.png)

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


## Relations

We need widgets for relations. At first just a simple one-to-one widget between collections would do wonders. It can always be combined with a list widget to create one-to-many relations.

Requires UI, and also requires moving the current logic for listing all entries in a collection out of the list controller and into the collection model.

## Authors & Profiles

There's no convention to speak of here across different sites built with static site generators, so this is not a totally straight forward thing to solve.

Might be as simple as being able to specify an authors document in the configuration file, something like:

authors:
  path: data/authors.json
  fields:
    - {label: "Name", name: "name", widget: "string"}
    - {label: "Biography", name: "bio", widget: "markdown"}

And then add a link in the profile dropdown that would let authors edit their own bio (as identified by a username the backend would need to supply...)

## Starter Sites

Right now getting started with netlify CMS requires quite a bit of work. Would be great to have at least templates for Roots, Middleman, Hugo and Jekyll, that'll work with the netlify-git-api. That way it's just a git clone and you're set...
