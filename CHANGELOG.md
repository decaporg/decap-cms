## [Unreleased] ([demo](https://cms-demo.netlify.com/))
<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>

  ## v2
  * (possibly breaking): return date object from date/datetime widgets if no format set ([@erquhart](https://github.com/erquhart) in [#1296](https://github.com/netlify/netlify-cms/pull/1296))
  * check for title/slug field on config load ([@tech4him1](https://github.com/tech4him1) in [#1203](https://github.com/netlify/netlify-cms/pull/1203))
</details>

## 1.9.4 (July 21, 2018) ([demo](https://1-9-4--cms-demo.netlify.com))
Fix multipart extension support for GitLab

## Bug Fixes
* Support extensions with multiple parts for GitLab ([@Nic128](https://github.com/Nic128) in [#1478](https://github.com/netlify/netlify-cms/pull/1478))


## 1.9.3 (July 3, 2018) ([demo](https://1-9-3--cms-demo.netlify.com))
Fix numbers in TOML output

## Bug Fixes
* fix int value output in TOML format file (@slathrop in #1458)


## 1.9.2 (June 15, 2018) ([demo](https://1-9-2--cms-demo.netlify.com))
Fix test repo crash

## Bug Fixes
* fix test-repo crash on non-existent folder ([@tech4him1](https://github.com/tech4him1) in [#1444](https://github.com/netlify/netlify-cms/pull/1444))


## 1.9.1 (June 14, 2018) ([demo](https://1-9-1--cms-demo.netlify.com))
Fix GitLab Implicit OAuth

## Bug Fixes
* fix GitLab Implicit OAuth ([@tech4him1](https://github.com/tech4him1) in [#1439](https://github.com/netlify/netlify-cms/pull/1439))


## 1.9.0 (June 12, 2018) ([demo](https://1-9-0--cms-demo.netlify.com))
GitLab support is here!!! 🎉🎉🎉

### Features
* add GitLab backend with Cursor API ([@Benaiah](https://github.com/Benaiah) in [#1343](https://github.com/netlify/netlify-cms/pull/1343))

## Bug Fixes
* fix workflow top panel styling ([@erquhart](https://github.com/erquhart) in [#1398](https://github.com/netlify/netlify-cms/pull/1398))
* only use `label_singular` when one item is rendered in List widget ([@robertkarlsson](https://github.com/robertkarlsson) in [#1422](https://github.com/netlify/netlify-cms/pull/1422))
* fix hidden widgets being rendered in editor components ([@robertkarlsson](https://github.com/robertkarlsson) in [#1414](https://github.com/netlify/netlify-cms/pull/1414))


## 1.8.4 (May 25, 2018) ([demo](https://1-8-4--cms-demo.netlify.com))
Fix markdown widget styling.

### Bug Fixes
  * fix markdown widget styling ([@erquhart](https://github.com/erquhart) in [#1384](https://github.com/netlify/netlify-cms/pull/1384))


## 1.8.3 (May 25, 2018) ([demo](https://1-8-3--cms-demo.netlify.com/))
Update dependencies.


## 1.8.2 (May 24, 2018) ([demo](https://1-8-2--cms-demo.netlify.com/))
Fix failure to save/publish.

### Bug Fixes
  * fix save/publish failure, revert overwrite prevention feature (@erquhart)


## 1.8.1 (May 23, 2018) ([demo](https://1-8-1--cms-demo.netlify.com/))
Allow upload of files larger than 1MB to GitHub, prevent unintentional file overwrites.

### Bug Fixes
* prevent overwriting when generated slug matches an existing file ([@brianlmacdonald](https://github.com/brianlmacdonald) in [#1239](https://github.com/netlify/netlify-cms/pull/1239))
* fix large files failing to load ([@tech4him1](https://github.com/tech4him1) in [#1224](https://github.com/netlify/netlify-cms/pull/1224))

### Beta Features
* enable custom commit message templates ([@delucis](https://github.com/delucis) in [#1359](https://github.com/netlify/netlify-cms/pull/1359))


## 1.8.0 (May 16, 2018) ([demo](https://1-8-0--cms-demo.netlify.com/))
Customizable relation widget display fields, squash merges for editorial workflow, perf
improvements.

### Features
* support `displayFields` config property for the relation widget ([@zurawiki](https://github.com/zurawiki) in [#1303](https://github.com/netlify/netlify-cms/pull/1303))

### Improvements
* prevent login for `git-gateway` backend when Git Gateway is not enabled for Netlify site ([@tech4him1](https://github.com/tech4him1) in [#1295](https://github.com/netlify/netlify-cms/pull/1295))

### Performance
* use `cloneElement` when possible for editor preview pane widgets ([@danielmahon](https://github.com/danielmahon) in [#1248](https://github.com/netlify/netlify-cms/pull/1248))
* upgrade to Webpack 4 ([@tech4him1](https://github.com/tech4him1) in [#1214](https://github.com/netlify/netlify-cms/pull/1214))

### Beta Features
* support `squash_merges` config option for GitHub backend ([@delucis](https://github.com/delucis) in [#1330](https://github.com/netlify/netlify-cms/pull/1330))


## 1.7.0 (April 24, 2018) ([demo](https://1-7-0--cms-demo.netlify.com/))
Allow custom auth endpoint, bug fixes.

### Features
* allow custom auth endpoint ([@erquhart](https://github.com/erquhart) in [#1294](https://github.com/netlify/netlify-cms/pull/1294))

### Improvements
* skip validation of optional fields when empty (@Dammmien in #1237)

### Bug Fixes
* fix GitHub auth button icon alignment (@erquhart in #1299)
* fix Git Gateway login hang (@ekoeryanto in #1240)


## 1.6.0 (April 19, 2018) ([demo](https://1-6-0--cms-demo.netlify.com/))
Markdown toolbar customization, manual date widget entry, bug fixes.

### Features
* Allow markdown editor toolbar customization ([@Dammmien](https://github.com/Dammmien) in [#1236](https://github.com/netlify/netlify-cms/pull/1236))
* Allow login screen to be skipped for test repo backend ([@erquhart](https://github.com/erquhart) in [#1291](https://github.com/netlify/netlify-cms/pull/1291))

### Bug Fixes
* Fix button/icon alignment on Safari 10 ([@maciejmatu](https://github.com/maciejmatu) in [#1227](https://github.com/netlify/netlify-cms/pull/1227))
* Allow typing in date widget ([@Dammmien](https://github.com/Dammmien) in [#1247](https://github.com/netlify/netlify-cms/pull/1247))


## 1.5.0 (April 11, 2018) ([demo](https://1-5-0--cms-demo.netlify.com/))
New time based slug placeholders, set config.yml URL with <link>.

### Features
* Add hour, minute, and second slug fields ([@terrierscript](https://github.com/terrierscript) in [#1207](https://github.com/netlify/netlify-cms/pull/1207))
* Allow setting config URL with <link> ([@brianlmacdonald](https://github.com/brianlmacdonald) in [#1146](https://github.com/netlify/netlify-cms/pull/1146))

### Bug Fixes
* Fix broken new media uploads for Git Gateway ([@tech4him1](https://github.com/tech4him1) in [#1221](https://github.com/netlify/netlify-cms/pull/1221))

### Dev Experience
* Enable editorial workflow for test backend ([@erquhart](https://github.com/erquhart) in [#1225](https://github.com/netlify/netlify-cms/pull/1225))


## 1.4.0 (March 29, 2018) ([demo](https://1-4-0--cms-demo.netlify.com/))
Filename creation can now be customized to exclude Unicode! Also, check out the new Beta Features! 💥

### Features
* Add option to strip Unicode from entry filenames ([@tech4him1](https://github.com/tech4him1) in [#1135](https://github.com/netlify/netlify-cms/pull/1135))

### Improvements
* Hide "create new" button for single files ([@tech4him1](https://github.com/tech4him1) in [#1200](https://github.com/netlify/netlify-cms/pull/1200))
* Filter editorial workflow entries by PR base branch ([@erquhart](https://github.com/erquhart) in [#1155](https://github.com/netlify/netlify-cms/pull/1155))

### Bug Fixes
* Allow list widget "add" button to be disabled ([@gazebosx3](https://github.com/gazebosx3) in [#1102](https://github.com/netlify/netlify-cms/pull/1102))
* Fix broken thumbnail when uploading an image to a private repository ([@Quicksaver](https://github.com/Quicksaver) in [#994](https://github.com/netlify/netlify-cms/pull/994))
* Get default value from each widget rather than setting all to null ([@MichaelRomani](https://github.com/MichaelRomani) in [#1126](https://github.com/netlify/netlify-cms/pull/1126))
* Fix editor validation notifications for editorial workflow ([@erquhart](https://github.com/erquhart) in [#1204](https://github.com/netlify/netlify-cms/pull/1204))
* Prevent Git Gateway users with invalid tokens from logging in ([@tech4him1](https://github.com/tech4him1) in [#1209](https://github.com/netlify/netlify-cms/pull/1209))
* Fix relation list preview ([@Quicksaver](https://github.com/Quicksaver) in [#1199](https://github.com/netlify/netlify-cms/pull/1199))
* Fix missing config file handling ([@talves](https://github.com/talves) in [#1182](https://github.com/netlify/netlify-cms/pull/1182))
* Fix initially blank date fields ([@tech4him1](https://github.com/tech4him1) in [#1210](https://github.com/netlify/netlify-cms/pull/1210))

### Beta Features
* Accept CSS strings in `registerPreviewStyle` ([@erquhart](https://github.com/erquhart) in [#1162](https://github.com/netlify/netlify-cms/pull/1162))
* Change manual init API to use the same bundle as auto init ([@talves](https://github.com/talves) and @erquhart in [#1173](https://github.com/netlify/netlify-cms/pull/1173))

### 4 tha devz
* Ship source code to npm ([@tech4him1](https://github.com/tech4him1) in [#1095](https://github.com/netlify/netlify-cms/pull/1095))


## 1.3.5 (March 6, 2018) ([demo](https://1-3-5--cms-demo.netlify.com/))
Fixes styling issues

* Revert lockfile update due to breaking changes in css processing deps ([@erquhart](https://github.com/erquhart))


## 1.3.4 (March 6, 2018) ([demo](https://1-3-4--cms-demo.netlify.com/))
Fixes editorial workflow entry failure

* Fix editorial workflow entries not loading ([@erquhart](https://github.com/erquhart))


## 1.3.3 (March 6, 2018) ([demo](https://1-3-3--cms-demo.netlify.com/))
Fixes load failure

* Fix bugs introduced by manual initialization ([@erquhart](https://github.com/erquhart) in [#1157](https://github.com/netlify/netlify-cms/pull/1157))


## 1.3.2 (March 6, 2018) ([demo](https://1-3-2--cms-demo.netlify.com/))
Fixes date widget default format, collection load failure when entry fails

* Fix date widget default format ([@erquhart](https://github.com/erquhart) in [#1143](https://github.com/netlify/netlify-cms/pull/1143))
* Fix collection failure when individual entries fail to load ([@tech4him1](https://github.com/tech4him1) in [#1093](https://github.com/netlify/netlify-cms/pull/1093))

### Beta Features
* Allow manual initialization and config injection ([@erquhart](https://github.com/erquhart) in [#1149](https://github.com/netlify/netlify-cms/pull/1149))


## 1.3.1 (March 3, 2018) ([demo](https://1-3-1--cms-demo.netlify.com/))
Fixes editorial workflow failure for unknown collections.

* Report editorial workflow load errors, ignore entries with unkown collections ([@erquhart](https://github.com/erquhart) in [#1153](https://github.com/netlify/netlify-cms/pull/1153))


## 1.3.0 (February 27, 2018) ([demo](https://1-3-0--cms-demo.netlify.com/))
Multi-part extensions, e.g. "en.md", a11y improvements in the editor, and bugfixes.

* Ensure unique id for each editor field ([@xifengjin88](https://github.com/xifengjin88) in [#1087](https://github.com/netlify/netlify-cms/pull/1087))
* Fix lists crashing when first value is not a string ([@tech4him1](https://github.com/tech4him1) in [#1115](https://github.com/netlify/netlify-cms/pull/1115))
* Support extensions with multiple parts (i.e. `en.md`) ([@tech4him1](https://github.com/tech4him1) in [#1123](https://github.com/netlify/netlify-cms/pull/1123))
* Fix lost unsaved changes when updating status or publishing from editor ([@erquhart](https://github.com/erquhart) in [#987](https://github.com/netlify/netlify-cms/pull/987))


## 1.2.2 (February 21, 2018) ([demo](https://1-2-2--cms-demo.netlify.com/))
Fixes ES5 transpiling.

* Remove babel-preset-env, fix ES5 transpiling ([@erquhart](https://github.com/erquhart) in [#1127](https://github.com/netlify/netlify-cms/pull/1127))


## 1.2.1 (February 21, 2018) ([demo](https://1-2-1--cms-demo.netlify.com/))
Allows `label_singular` config for collections and lists and distinct frontmatter delimiters.

* Accept `label_singular` in collection config ([@peduarte](https://github.com/peduarte) in [#1086](https://github.com/netlify/netlify-cms/pull/1086))
* Transpile down to ES5 to support older tooling eg. Webpack 1 ([@tech4him1](https://github.com/tech4him1) in [#1107](https://github.com/netlify/netlify-cms/pull/1107))
* Allow different opening and closing frontmatter delimiters ([@tech4him1](https://github.com/tech4him1) in [#1094](https://github.com/netlify/netlify-cms/pull/1094))


## 1.2.0 (February 13, 2018) ([demo](https://1-2-0--cms-demo.netlify.com/))
Adds support for multiple frontmatter formats and custom delimiters, UI improvements.

* Use babel-preset-env to transpile for supported environments only ([@tech4him1](https://github.com/tech4him1) in [#765](https://github.com/netlify/netlify-cms/pull/765))
* Change direction of collapsed editor widget arrow indicators ([@Doocey](https://github.com/Doocey) in [#1059](https://github.com/netlify/netlify-cms/pull/1059))
* Support for writing frontmatter in JSON, TOML, or YAML ([@tech4him1](https://github.com/tech4him1) in [#933](https://github.com/netlify/netlify-cms/pull/933))
* Add collection label next to search results ([@solpark](https://github.com/solpark) in [#1068](https://github.com/netlify/netlify-cms/pull/1068))
* Support custom delimiters for frontmatter ([@Swieckowski](https://github.com/Swieckowski) in [#1064](https://github.com/netlify/netlify-cms/pull/1064))


## 1.1.0 (January 25, 2018) ([demo](https://1-1-0--cms-demo.netlify.com/))

* Fix metadata handling for all children of a list field ([@Quicksaver](https://github.com/Quicksaver) in [#719](https://github.com/netlify/netlify-cms/pull/719))
* Allow registry of external backends ([@talves](https://github.com/talves) in [#1011](https://github.com/netlify/netlify-cms/pull/1011))


## 1.0.4 (January 23, 2018) ([demo](https://1-0-4--cms-demo.netlify.com/))

* Fix markdown widget re-rendering after load ([@erquhart](https://github.com/erquhart) in [#955](https://github.com/netlify/netlify-cms/pull/955))
* Fix image form not displaying when added as first item in markdown widget ([@Dammmien](https://github.com/Dammmien) in [#926](https://github.com/netlify/netlify-cms/pull/926))
* Add collapse all/expand all functionality to List widget ([@drlogout](https://github.com/drlogout) in [#912](https://github.com/netlify/netlify-cms/pull/912))
* Add expand/collapse functionality to object widget ([@drlogout](https://github.com/drlogout) in [#927](https://github.com/netlify/netlify-cms/pull/927))
* Fix vertically centered icon positioning in Firefox ([@jimmaaay](https://github.com/jimmaaay) in [#976](https://github.com/netlify/netlify-cms/pull/976))
* Fix new uploads not showing in media library ([@tech4him1](https://github.com/tech4him1) in [#925](https://github.com/netlify/netlify-cms/pull/925))
* Overhaul widgets section in docs ([@hcavalieri](https://github.com/hcavalieri) in [#866](https://github.com/netlify/netlify-cms/pull/866))
* Use proper formatting when writing JSON files ([@tech4him1](https://github.com/tech4him1) in [#979](https://github.com/netlify/netlify-cms/pull/979))
* Ensure temporary storage is available before attempting to write ([@vencax](https://github.com/vencax) in [#550](https://github.com/netlify/netlify-cms/pull/550))
* Show SVG preview images in the media library ([@Jinksi](https://github.com/Jinksi) in [#954](https://github.com/netlify/netlify-cms/pull/954))
* Fix failed PR force-merge showing success message ([@tech4him1](https://github.com/tech4him1) in [#1016](https://github.com/netlify/netlify-cms/pull/1016))
* Fix false proptype warning for collection view ([@Quicksaver](https://github.com/Quicksaver) in [#998](https://github.com/netlify/netlify-cms/pull/998))


## 1.0.3 (December 19, 2017) ([demo](https://1-0-3--cms-demo.netlify.com/))

* Fix select widgets with object type options ([@tech4him1](https://github.com/tech4him1) in [#920](https://github.com/netlify/netlify-cms/pull/920))
* Warn when uploading asset with same name as existing asset ([@Dammmien](https://github.com/Dammmien) in [#853](https://github.com/netlify/netlify-cms/pull/853))
* Fix Slate plugins broken during 0.30 migration ([@Dammmien](https://github.com/Dammmien) in [#856](https://github.com/netlify/netlify-cms/pull/856))
* Fix infinite scrolling for collections with integrations ([@erquhart](https://github.com/erquhart) in [#940](https://github.com/netlify/netlify-cms/pull/940))


## 1.0.2 (December 7, 2017) ([demo](https://1-0-2--cms-demo.netlify.com/))

* Fix position of editor view controls ([@biilmann](https://github.com/biilmann) in [#886](https://github.com/netlify/netlify-cms/pull/886))
* Update docs intro to direct to new content ([@verythorough](https://github.com/verythorough) in [#891](https://github.com/netlify/netlify-cms/pull/891))


## 1.0.1 (December 7, 2017) ([demo](https://1-0-1--cms-demo.netlify.com/))

* Add configuration options doc ([@verythorough](https://github.com/verythorough) in [#885](https://github.com/netlify/netlify-cms/pull/885))
* Add new docs website landing page ([@ziburski](https://github.com/ziburski) in [#880](https://github.com/netlify/netlify-cms/pull/880))
* Rework Test Drive and Quick Start docs ([@verythorough](https://github.com/verythorough) in [#888](https://github.com/netlify/netlify-cms/pull/888))


## 1.0.0 (December 7, 2017) ([demo](https://1-0-0--cms-demo.netlify.com/))

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


## 0.7.6 (November 27, 2017) ([demo](https://0-7-6--cms-demo.netlify.com/))

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


## 0.7.5 (November 19, 2017) ([demo](https://0-7-5--cms-demo.netlify.com/))

* Add private media support for asset integrations ([@erquhart](https://github.com/erquhart) in [#834](https://github.com/netlify/netlify-cms/pull/834))


## 0.7.4 (November 15, 2017) ([demo](https://0-7-4--cms-demo.netlify.com/))

* Remove trailing slash from directory listing path ([@biilmann](https://github.com/biilmann) in [#817](https://github.com/netlify/netlify-cms/pull/817))
* Fix images with non-lowercase extensions not being treated as images ([@erquhart](https://github.com/erquhart) in [#816](https://github.com/netlify/netlify-cms/pull/816))
* Prompt before closing window with unsaved changes in the editor ([@benaiah](https://github.com/benaiah) in [#815](https://github.com/netlify/netlify-cms/pull/815))


## 0.7.3 (November 11, 2017) ([demo](https://0-7-3--cms-demo.netlify.com/))

* Fix persisting files with no body/data files ([@ebello](https://github.com/ebello) in [#808](https://github.com/netlify/netlify-cms/pull/808))
* Fix ControlHOC ref for redux container widgets ([@erquhart](https://github.com/erquhart) in [#812](https://github.com/netlify/netlify-cms/pull/812))
* Fix entries not saving due to null integrations state ([@erquhart](https://github.com/erquhart) in [#814](https://github.com/netlify/netlify-cms/pull/814))
* Fix requestAnimationFrame warnings in tests ([@tech4him1](https://github.com/tech4him1) in [#811](https://github.com/netlify/netlify-cms/pull/811))


## 0.7.2 (November 11, 2017) ([demo](https://0-7-2--cms-demo.netlify.com/))

* Only rebase editorial workflow pull requests if assets are stored in content repo ([@erquhart](https://github.com/erquhart) in [#804](https://github.com/netlify/netlify-cms/pull/804))
* Fix Netlify Identity widget logout method being called after signup redirect ([@tech4him1](https://github.com/tech4him1) in [#805](https://github.com/netlify/netlify-cms/pull/805))


## 0.7.1 (November 11, 2017) ([demo](https://0-7-1--cms-demo.netlify.com/))

* Enable sourcemaps ([@erquhart](https://github.com/erquhart) in [#803](https://github.com/netlify/netlify-cms/pull/803))
* Add unselected option to select widget when no default is set ([@benaiah](https://github.com/benaiah) in [#673](https://github.com/netlify/netlify-cms/pull/673))
* Fix image not shown after upload for Git Gateway ([@erquhart](https://github.com/erquhart) in [#790](https://github.com/netlify/netlify-cms/pull/790))
* Fix empty media folder loading error ([@erquhart](https://github.com/erquhart) in [#791](https://github.com/netlify/netlify-cms/pull/791))
* Fix error for non-markdown files in editorial workflow ([@tech4him1](https://github.com/tech4him1) in [#794](https://github.com/netlify/netlify-cms/pull/794))
* Fix login when accept_roles is set ([@tech4him1](https://github.com/tech4him1) in [#801](https://github.com/netlify/netlify-cms/pull/801))
* Add error boundary to editor preview iframe ([@erquhart](https://github.com/erquhart) in [#779](https://github.com/netlify/netlify-cms/pull/779))


## 0.7.0 (November 9, 2017) ([demo](https://0-7-0--cms-demo.netlify.com/))

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
