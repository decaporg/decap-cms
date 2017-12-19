## [Unreleased]
<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>
</details>

## 1.0.3 (December 19, 2017)

* Fix select widgets with object type options ([@tech4him1](https://github.com/tech4him1) in [#920](https://github.com/netlify/netlify-cms/pull/920))
* Warn when uploading asset with same name as existing asset ([@Dammmien](https://github.com/Dammmien) in [#853](https://github.com/netlify/netlify-cms/pull/853))
* Fix Slate plugins broken during 0.30 migration ([@Dammmien](https://github.com/Dammmien) in [#856](https://github.com/netlify/netlify-cms/pull/856))
* Fix infinite scrolling for collections with integrations ([@erquhart](https://github.com/erquhart) in [#940](https://github.com/netlify/netlify-cms/pull/940))

## 1.0.2 (December 7, 2017)

* Fix position of editor view controls ([@biilmann](https://github.com/biilmann) in [#886](https://github.com/netlify/netlify-cms/pull/886))
* Update docs intro to direct to new content ([@verythorough](https://github.com/verythorough) in [#891](https://github.com/netlify/netlify-cms/pull/891))


## 1.0.1 (December 7, 2017)

* Add configuration options doc ([@verythorough](https://github.com/verythorough) in [#885](https://github.com/netlify/netlify-cms/pull/885))
* Add new docs website landing page ([@ziburski](https://github.com/ziburski) in [#880](https://github.com/netlify/netlify-cms/pull/880))
* Rework Test Drive and Quick Start docs ([@verythorough](https://github.com/verythorough) in [#888](https://github.com/netlify/netlify-cms/pull/888))

## 1.0.0 (December 7, 2017)

The first major release of Netlify CMS!! Here are the big features:

### All New UI 💫
The CMS UI has been completely redesigned from the ground up!

* All new visuals and reprised UX throughout
* List view/grid view option for collections
* Deletion now works for editorial workflow
* Control publishing and editorial workflow status from the entry editor
* Descriptions can now be added for each collection

## All New Docs 💥
The docs at netlifycms.org have been rewritten and vastly improved!

* Full references with code samples for every configuration option, collection type, and widget
* Easier docs contributions with the website built directly in the repo
* Updated intro docs with a new Gatsby starter template in addition to the Hugo one

## Changes

* Fix backspace not removing empty block in markdown editor ([@Dammmien](https://github.com/Dammmien) in [#854](https://github.com/netlify/netlify-cms/pull/854))
* Add select widget documentation ([@ackushiw](https://github.com/ackushiw) in [#806](https://github.com/netlify/netlify-cms/pull/806))
* Migrate netlifycms.org source into this repo ([@verythorough](https://github.com/verythorough) in [#860](https://github.com/netlify/netlify-cms/pull/860))
* Fix Slate mark rendering ([@erquhart](https://github.com/erquhart) in [#858](https://github.com/netlify/netlify-cms/pull/858))
* Do not infer file format if format specified in config ([@tech4him1](https://github.com/tech4him1) in [#795](https://github.com/netlify/netlify-cms/pull/795))
* Infer format from extension for new entries ([@tech4him1](https://github.com/tech4him1) in [#796](https://github.com/netlify/netlify-cms/pull/796))
* Throw on unsupported format ([@tech4him1](https://github.com/tech4him1) in [#831](https://github.com/netlify/netlify-cms/pull/831))
* Update widget docs ([@verythorough](https://github.com/verythorough) in [#876](https://github.com/netlify/netlify-cms/pull/876))
* Implement new UI, restructure/refactor project ([@erquhart](https://github.com/erquhart) and [@neutyp](https://github.com/neutyp) in [#785](https://github.com/netlify/netlify-cms/pull/785))


## 0.7.6 (November 27, 2017)

* Migrate to Slate 0.30.x ([@erquhart](https://github.com/erquhart) in [#826](https://github.com/netlify/netlify-cms/pull/826))
* Fix empty image fields saving null or undefined ([@tech4him1](https://github.com/tech4him1) in [#829](https://github.com/netlify/netlify-cms/pull/829))
* Add JSON as manually supported format ([@tech4him1](https://github.com/tech4him1) in [#830](https://github.com/netlify/netlify-cms/pull/830))
* Enable webpack scope hoisting ([@tech4him1](https://github.com/tech4him1) in [#840](https://github.com/netlify/netlify-cms/pull/840))
* Update bundled version of gotrue-js to latest ([@biilmann](https://github.com/biilmann) in [#837](https://github.com/netlify/netlify-cms/pull/837))
* Add global error boundary ([@tech4him1](https://github.com/tech4him1) in [#847](https://github.com/netlify/netlify-cms/pull/847))
* Fix datetime formatting, allow empty value ([@biilmann](https://github.com/biilmann) in [#842](https://github.com/netlify/netlify-cms/pull/842))

### Docs

* Update authentication doc to cover all backends ([@verythorough](https://github.com/verythorough) in [#751](https://github.com/netlify/netlify-cms/pull/751))
* Add oauth-provider-go to custom-authentication.md ([@igk1972](https://github.com/igk1972) in [#845](https://github.com/netlify/netlify-cms/pull/845))

## 0.7.5 (November 19, 2017)

* Add private media support for asset integrations ([@erquhart](https://github.com/erquhart) in [#834](https://github.com/netlify/netlify-cms/pull/834))

## 0.7.4 (November 15, 2017)

* Remove trailing slash from directory listing path ([@biilmann](https://github.com/biilmann) in [#817](https://github.com/netlify/netlify-cms/pull/817))
* Fix images with non-lowercase extensions not being treated as images ([@erquhart](https://github.com/erquhart) in [#816](https://github.com/netlify/netlify-cms/pull/816))
* Prompt before closing window with unsaved changes in the editor ([@benaiah](https://github.com/benaiah) in [#815](https://github.com/netlify/netlify-cms/pull/815))

## 0.7.3 (November 11, 2017)

* Fix persisting files with no body/data files ([@ebello](https://github.com/ebello) in [#808](https://github.com/netlify/netlify-cms/pull/808))
* Fix ControlHOC ref for redux container widgets ([@erquhart](https://github.com/erquhart) in [#812](https://github.com/netlify/netlify-cms/pull/812))
* Fix entries not saving due to null integrations state ([@erquhart](https://github.com/erquhart) in [#814](https://github.com/netlify/netlify-cms/pull/814))
* Fix requestAnimationFrame warnings in tests ([@tech4him1](https://github.com/tech4him1) in [#811](https://github.com/netlify/netlify-cms/pull/811))

## 0.7.2 (November 11, 2017)

* Only rebase editorial workflow pull requests if assets are stored in content repo ([@erquhart](https://github.com/erquhart) in [#804](https://github.com/netlify/netlify-cms/pull/804))
* Fix Netlify Identity widget logout method being called after signup redirect ([@tech4him1](https://github.com/tech4him1) in [#805](https://github.com/netlify/netlify-cms/pull/805))

## 0.7.1 (November 11, 2017)

* Enable sourcemaps ([@erquhart](https://github.com/erquhart) in [#803](https://github.com/netlify/netlify-cms/pull/803))
* Add unselected option to select widget when no default is set ([@benaiah](https://github.com/benaiah) in [#673](https://github.com/netlify/netlify-cms/pull/673))
* Fix image not shown after upload for Git Gateway ([@erquhart](https://github.com/erquhart) in [#790](https://github.com/netlify/netlify-cms/pull/790))
* Fix empty media folder loading error ([@erquhart](https://github.com/erquhart) in [#791](https://github.com/netlify/netlify-cms/pull/791))
* Fix error for non-markdown files in editorial workflow ([@tech4him1](https://github.com/tech4him1) in [#794](https://github.com/netlify/netlify-cms/pull/794))
* Fix login when accept_roles is set ([@tech4him1](https://github.com/tech4him1) in [#801](https://github.com/netlify/netlify-cms/pull/801))
* Add error boundary to editor preview iframe ([@erquhart](https://github.com/erquhart) in [#779](https://github.com/netlify/netlify-cms/pull/779))

## 0.7.0 (November 9, 2017)

### Media Library UI
The CMS now features a media library UI for browsing, adding, and removing media from your content
repo! The library shows assets in from the directory set as `media_library` in the CMS config. The
media library is fully backwards compatible for existing CMS installations.

### All Changes
* Add config option to disable deletion for a collection ([@rpullinger](https://github.com/rpullinger) in [#707](https://github.com/netlify/netlify-cms/pull/707))
* Fix TOML files not being saved with the correct extension ([@tech4him1](https://github.com/tech4him1) in [#757](https://github.com/netlify/netlify-cms/pull/757))
* Clean up file formatters ([@tech4him1](https://github.com/tech4him1) in [#759](https://github.com/netlify/netlify-cms/pull/759))
* Add scroll sync toggle to editor ([@Jinksi](https://github.com/Jinksi) in [#693](https://github.com/netlify/netlify-cms/pull/693))
* Disable login button while login is in progress ([@tech4him1](https://github.com/tech4him1) in [#741](https://github.com/netlify/netlify-cms/pull/741))
* Improve markdown editor active style indicator accuracy ([@pjsier](https://github.com/pjsier) in [#774](https://github.com/netlify/netlify-cms/pull/774))
* Add media library UI ([@erquhart](https://github.com/erquhart) in [#554](https://github.com/netlify/netlify-cms/pull/554))
* Fix transparent background on list widget ([@Jinksi](https://github.com/Jinksi) in [#768](https://github.com/netlify/netlify-cms/pull/768))
