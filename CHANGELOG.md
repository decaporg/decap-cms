## [Unreleased]
<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>
</details>

## 0.7.1 (November 11, 2017)

* Enable sourcemaps ([@erquhart](https://github.com/erquhart) in [#803](https://github.com/pulls/803))
* Add unselected option to select widget when no default is set ([@benaiah](https://github.com/benaiah) in [#673](https://github.com/pulls/673))
* Fix image not shown after upload for Git Gateway ([@erquhart](https://github.com/erquhart) in [#790](https://github.com/pulls/790))
* Fix empty media folder loading error ([@erquhart](https://github.com/erquhart) in [#791](https://github.com/pulls/791))
* Fix error for non-markdown files in editorial workflow ([@tech4him1](https://github.com/tech4him1) in [#794](https://github.com/pulls/794))
* Fix login when accept_roles is set ([@tech4him1](https://github.com/tech4him1) in [#801](https://github.com/pulls/801))
* Add error boundary to editor preview iframe ([@erquhart](https://github.com/erquhart) in [#779](https://github.com/pulls/779))

## 0.7.0 (November 9, 2017)

### Media Library UI
The CMS now features a media library UI for browsing, adding, and removing media from your content
repo! The library shows assets in from the directory set as `media_library` in the CMS config. The
media library is fully backwards compatible for existing CMS installations.

### All Changes
* Add config option to disable deletion for a collection ([@rpullinger](https://github.com/rpullinger) in [#707](https://github.com/pulls/707))
* Fix TOML files not being saved with the correct extension ([@tech4him1](https://github.com/tech4him1) in [#757](https://github.com/pulls/757))
* Clean up file formatters ([@tech4him1](https://github.com/tech4him1) in [#759](https://github.com/pulls/759))
* Add scroll sync toggle to editor ([@Jinksi](https://github.com/Jinksi) in [#693](https://github.com/pulls/693))
* Disable login button while login is in progress ([@tech4him1](https://github.com/tech4him1) in [#741](https://github.com/pulls/741))
* Improve markdown editor active style indicator accuracy ([@pjsier](https://github.com/pjsier) in [#774](https://github.com/pulls/774))
* Add media library UI ([@erquhart](https://github.com/erquhart) in [#554](https://github.com/pulls/554))
* Fix transparent background on list widget ([@Jinksi](https://github.com/Jinksi) in [#768](https://github.com/pulls/768))
