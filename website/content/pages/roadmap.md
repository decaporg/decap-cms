---
title: Roadmap
description: Planned features for Netlify CMS
heading: Roadmap
intro: Planned features for Netlify CMS
---
## Meta
- tests, tests, and more tests
- implement bootstrapping lifecycle (auth -> load extensions -> init extensions -> etc)
- fix builds to provide cjs and umd with shared dependencies

## Publishing
- obvious metadata
- store draft field values locally
- simple drafts for non-editorial workflow
- unpublish capability for both workflow and non-workflow
- multiple file groups published/unpublished together

## File handling
- top level arrays in output (just use `field`)
- stop deleting fields that exist in an entry but aren't in the config
- content bundles
  - support using the slug in the folder name
  - support storing assets in the current entry's folder

## Dev experience
- local git backend

## Markdown editor
- tables in markdown
- mdx support
- improved html and code editing support for markdown editor
- markdown shortcuts in markdown rich text editor
- in markdown widget, show editor component preview instead of component fields

## UX
- collection sorting
- per-entry controls on the collection screen (delete, publish/unpublish)
- show both published and unpublished on collection screen
- links to deploy previews everywhere (collection screen, editor, workflow)
- responsive
- in editor, show the resulting url for the current entry (provides slug visibility too)
- duplicate existing entry
- faux pagination for non-paginated backends (github)
- accept dot notation in field names to achieve nested values

## Validation
- nested entry validation
- allow extensions to include their own validation methods, including for validation of their config

## Future
- i18n
- config ui
- pwa/offline
- interactive merge conflict resolution
- robust relations
