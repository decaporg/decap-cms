## [Unreleased]
<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>
</details>

## 0.7.0 (November 9, 2017)

### Media Library UI
The CMS now features a media library UI for browsing, adding, and removing media from your content
repo! The library shows assets in from the directory set as `media_library` in the CMS config. The
media library is fully backwards compatible for existing CMS installations.

### All Changes
* Add config option to disable deletion for a collection (@rpullinger in #707)
* Fix TOML files not being saved with the correct extension (@tech4him1 in #757)
* Clean up file formatters (@tech4him1 in #759)
* Add scroll sync toggle to editor (@Jinksi in #693)
* Disable login button while login is in progress (@tech4him1 in #741)
* Improve markdown editor active style indicator accuracy (@pjsier in #774)
* Add media library UI (@erquhart in #554)
* Fix transparent background on list widget (@Jinksi in #768)
