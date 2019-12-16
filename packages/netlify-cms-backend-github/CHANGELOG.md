# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.5.0-beta.8](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.7...netlify-cms-backend-github@2.5.0-beta.8) (2019-12-16)


### Bug Fixes

* don't fail on deleting non existent branch ([1e77d4b](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/1e77d4b7688de795ab1b01c6ce2483a0383bbfb6))





# [2.5.0-beta.7](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.6...netlify-cms-backend-github@2.5.0-beta.7) (2019-12-02)


### Features

* content in sub folders ([#2897](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2897)) ([afcfe5b](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/afcfe5b6d5f32669e9061ec596bd35ad545d61a3))





# [2.5.0-beta.6](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.5...netlify-cms-backend-github@2.5.0-beta.6) (2019-11-26)


### Bug Fixes

* **backend-github:** prepend collection name ([#2878](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2878)) ([465f463](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/465f4639597f258d5aa2c1b65e9d2c16023ee7ae))


### Features

* workflow unpublished entry ([#2914](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2914)) ([41bb9aa](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/41bb9aac0dd6fd9f8ff157bb0b29c85aa87fe04d))





# [2.5.0-beta.5](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.4...netlify-cms-backend-github@2.5.0-beta.5) (2019-11-18)


### Bug Fixes

* **backend-github:** editorial workflow commits ([#2867](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2867)) ([86adca3](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/86adca3a18f25ab74d1c6702bafab250f005ceec))
* make forkExists name matching case-insensitive ([#2869](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2869)) ([9978769](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/9978769ece9262265d3efa77357f9e8b46ad9a1e))
* **backend-github:** loaded entries limit ([#2873](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2873)) ([68a8c8a](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/68a8c8a693646ebd33fae791aaaec47b050e0186))
* **git-gateway:** unpublished entries not loaded for git-gateway(GitHub) ([#2856](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2856)) ([4a2328b](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/4a2328b2f10ea678184391e4caf235b41323cd3e))


### Features

* commit media with post ([#2851](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2851)) ([6515dee](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/6515dee8715d8571ea19484a7dfab7cfd0cc40be))





# [2.5.0-beta.4](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.3...netlify-cms-backend-github@2.5.0-beta.4) (2019-11-07)


### Bug Fixes

* **github-backend:** load media URLs via API ([#2817](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2817)) ([eaeaf44](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/eaeaf4483287a1f724ee60ef321ff749f1c20acf))
* change default open authoring scope, make it configurable ([#2821](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2821)) ([002cdd7](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/002cdd77a856bde3672e75dde6d3a2b246e1035f))
* display UI to fork a repo only when fork doesn't exist ([#2802](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2802)) ([7f90d0e](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/7f90d0e065315b9073d21fd733f42f3838ecfe09))


### Features

* add go back to site button ([#2538](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2538)) ([f206e7e](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/f206e7e5a13fb48ec6b27dce0dbb3a59b61de8f9))





# [2.5.0-beta.3](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.2...netlify-cms-backend-github@2.5.0-beta.3) (2019-09-26)


### Bug Fixes

* **backend-github:** update Open Authoring branches with no PR ([#2618](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2618)) ([6817033](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/6817033))
* **git-gateway:** pass api URL instead of constructing it from repo value ([#2631](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2631)) ([922c0f3](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/922c0f3))
* **github-backend:** handle race condition in editorial workflow ([#2658](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2658)) ([97f1f84](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/97f1f84))





# [2.5.0-beta.2](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.1...netlify-cms-backend-github@2.5.0-beta.2) (2019-09-04)


### Bug Fixes

* **github-graphql:** use getMediaDisplayURL to load media with auth header ([#2652](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2652)) ([e674e43](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/e674e43))


### Features

* **backend-github:** GitHub GraphQL API support ([#2456](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2456)) ([ece136c](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/ece136c))





# [2.5.0-beta.1](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.5.0-beta.0...netlify-cms-backend-github@2.5.0-beta.1) (2019-08-24)

**Note:** Version bump only for package netlify-cms-backend-github





# [2.5.0-beta.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.2...netlify-cms-backend-github@2.5.0-beta.0) (2019-07-24)


### Features

* **backend-github:** Open Authoring ([#2430](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2430)) ([edf0a3a](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/edf0a3a))





## [2.4.2](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.2-beta.0...netlify-cms-backend-github@2.4.2) (2019-04-10)

**Note:** Version bump only for package netlify-cms-backend-github





## [2.4.2-beta.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.1...netlify-cms-backend-github@2.4.2-beta.0) (2019-04-05)

**Note:** Version bump only for package netlify-cms-backend-github





## [2.4.1](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.1-beta.1...netlify-cms-backend-github@2.4.1) (2019-03-29)

**Note:** Version bump only for package netlify-cms-backend-github





## [2.4.1-beta.1](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.1-beta.0...netlify-cms-backend-github@2.4.1-beta.1) (2019-03-26)


### Bug Fixes

* export on netlify-cms and maps on esm ([#2244](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2244)) ([6ffd13b](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/6ffd13b))





## [2.4.1-beta.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.4.0...netlify-cms-backend-github@2.4.1-beta.0) (2019-03-25)


### Bug Fixes

* update peer dep versions ([#2234](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2234)) ([7987091](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/7987091))





# [2.4.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.3.0...netlify-cms-backend-github@2.4.0) (2019-03-22)


### Features

* add ES module builds ([#2215](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2215)) ([d142b32](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/d142b32))





# [2.3.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.3.0-beta.0...netlify-cms-backend-github@2.3.0) (2019-03-22)

**Note:** Version bump only for package netlify-cms-backend-github





# [2.3.0-beta.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.2.3-beta.0...netlify-cms-backend-github@2.3.0-beta.0) (2019-03-21)


### Bug Fixes

* fix umd builds ([#2214](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2214)) ([e04f6be](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/e04f6be))


### Features

* provide usable UMD builds for all packages ([#2141](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2141)) ([82cc794](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/82cc794))





## [2.2.3-beta.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.2.2...netlify-cms-backend-github@2.2.3-beta.0) (2019-03-15)


### Features

* upgrade to Emotion 10 ([#2166](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2166)) ([ccef446](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/ccef446))





## [2.2.2](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.2.1...netlify-cms-backend-github@2.2.2) (2019-03-08)

**Note:** Version bump only for package netlify-cms-backend-github





## [2.2.1](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.2.0...netlify-cms-backend-github@2.2.1) (2019-02-26)

**Note:** Version bump only for package netlify-cms-backend-github





# [2.2.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.1.0...netlify-cms-backend-github@2.2.0) (2019-02-08)


### Features

* **workflow:** add deploy preview links ([#2028](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/2028)) ([15d221d](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/15d221d))





# [2.1.0](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.9...netlify-cms-backend-github@2.1.0) (2018-11-12)


### Features

* allow custom logo on auth page ([#1818](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/1818)) ([c6ae1e8](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/c6ae1e8))





<a name="2.0.9"></a>
## [2.0.9](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.8...netlify-cms-backend-github@2.0.9) (2018-09-17)




**Note:** Version bump only for package netlify-cms-backend-github

<a name="2.0.8"></a>
## [2.0.8](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.7...netlify-cms-backend-github@2.0.8) (2018-09-06)




**Note:** Version bump only for package netlify-cms-backend-github

<a name="2.0.7"></a>
## [2.0.7](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.6...netlify-cms-backend-github@2.0.7) (2018-08-27)




**Note:** Version bump only for package netlify-cms-backend-github

<a name="2.0.6"></a>
## [2.0.6](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.5...netlify-cms-backend-github@2.0.6) (2018-08-24)




**Note:** Version bump only for package netlify-cms-backend-github

<a name="2.0.5"></a>
## [2.0.5](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.4...netlify-cms-backend-github@2.0.5) (2018-08-07)


### Bug Fixes

* **backends:** fix commit message handling ([#1568](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/1568)) ([f7e7120](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/f7e7120))




<a name="2.0.4"></a>
## [2.0.4](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.3...netlify-cms-backend-github@2.0.4) (2018-08-01)


### Bug Fixes

* **workflow:** enable workflow per method ([#1569](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/1569)) ([90b8156](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/90b8156))




<a name="2.0.3"></a>
## [2.0.3](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.2...netlify-cms-backend-github@2.0.3) (2018-08-01)


### Bug Fixes

* **github:** fix image uploading ([#1561](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/1561)) ([ddc8f04](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/ddc8f04))
* **workflow:** fix status not set on new workflow entries ([#1558](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/issues/1558)) ([0aa085f](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/commit/0aa085f))




<a name="2.0.2"></a>
## [2.0.2](https://github.com/netlify/netlify-cms/tree/master/packages/netlify-cms-backend-github/compare/netlify-cms-backend-github@2.0.1...netlify-cms-backend-github@2.0.2) (2018-07-28)




**Note:** Version bump only for package netlify-cms-backend-github

<a name="2.0.1"></a>
## 2.0.1 (2018-07-26)



<a name="2.0.0"></a>
# 2.0.0 (2018-07-26)




**Note:** Version bump only for package netlify-cms-backend-github
