# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.2.3](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.2.2...decap-cms-widget-datetime@3.2.3) (2024-08-30)

### Bug Fixes

- trigger change if default is {{now}} ([#7272](https://github.com/decaporg/decap-cms/issues/7272)) ([556e0d5](https://github.com/decaporg/decap-cms/commit/556e0d56aa623219d4f0f3be93bd2ba410e6596f))

## [3.2.2](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.2.1...decap-cms-widget-datetime@3.2.2) (2024-08-13)

### Reverts

- Revert "Update dependencies (#7264)" ([22d483a](https://github.com/decaporg/decap-cms/commit/22d483a5b0c654071ae05735ac4f49abdc13d38c)), closes [#7264](https://github.com/decaporg/decap-cms/issues/7264)

## [3.2.1](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.2.0...decap-cms-widget-datetime@3.2.1) (2024-08-13)

**Note:** Version bump only for package decap-cms-widget-datetime

# [3.2.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.5...decap-cms-widget-datetime@3.2.0) (2024-08-12)

### Fix

- improve datetime widget ([#7261](https://github.com/decaporg/decap-cms/issues/7261)) ([94993be](https://github.com/decaporg/decap-cms/commit/94993be8c5b206b61068487f2d751fb0aa77859a)), closes [#3679](https://github.com/decaporg/decap-cms/issues/3679) [#7250](https://github.com/decaporg/decap-cms/issues/7250)

### BREAKING CHANGES

- The datetime field is empty by default, from now on, but it was prefilled with the current date until now. Use `default: '{{now}}'` to prefill the field with the current date.

## [3.1.5](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.4...decap-cms-widget-datetime@3.1.5) (2024-04-16)

### Bug Fixes

- datetime parsing display value when format not provided ([#7181](https://github.com/decaporg/decap-cms/issues/7181)) ([9718772](https://github.com/decaporg/decap-cms/commit/9718772349d5199e01137ef08606eaa82da45e16))

## [3.1.4](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.3...decap-cms-widget-datetime@3.1.4) (2024-04-11)

### Bug Fixes

- fix formatInputValue ignoring format ([#7170](https://github.com/decaporg/decap-cms/issues/7170)) ([0b4b1cb](https://github.com/decaporg/decap-cms/commit/0b4b1cbdaf9da623f115633b86c67015921453b0))

## [3.1.3](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.2...decap-cms-widget-datetime@3.1.3) (2024-04-03)

### Bug Fixes

- **datetime-widget:** revert default date format to include timezone ([#7165](https://github.com/decaporg/decap-cms/issues/7165)) ([46294d6](https://github.com/decaporg/decap-cms/commit/46294d6fcd7f785f8c6346baeaa703d72b833b3b))

## [3.1.2](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.1...decap-cms-widget-datetime@3.1.2) (2024-03-29)

**Note:** Version bump only for package decap-cms-widget-datetime

## [3.1.1](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0-beta.3...decap-cms-widget-datetime@3.1.1) (2024-03-21)

**Note:** Version bump only for package decap-cms-widget-datetime

# [3.1.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0-beta.3...decap-cms-widget-datetime@3.1.0) (2024-02-01)

**Note:** Version bump only for package decap-cms-widget-datetime

# [3.1.0-beta.3](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0-beta.2...decap-cms-widget-datetime@3.1.0-beta.3) (2024-01-31)

### Bug Fixes

- change datetime widget value format ([#7072](https://github.com/decaporg/decap-cms/issues/7072)) ([445a48c](https://github.com/decaporg/decap-cms/commit/445a48c54ad87184425c5f460de262b31c1f0cae)), closes [#7066](https://github.com/decaporg/decap-cms/issues/7066)

# [3.1.0-beta.2](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0-beta.1...decap-cms-widget-datetime@3.1.0-beta.2) (2024-01-16)

### Bug Fixes

- change dayjs to per-package dependency ([#6992](https://github.com/decaporg/decap-cms/issues/6992)) ([0c278b0](https://github.com/decaporg/decap-cms/commit/0c278b0a83d93233d3b3e860d3029df20fe1c501))

# [3.1.0-beta.1](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0-beta.0...decap-cms-widget-datetime@3.1.0-beta.1) (2023-11-23)

### Performance Improvements

- replace moment with dayjs ([#6980](https://github.com/decaporg/decap-cms/issues/6980)) ([22370b1](https://github.com/decaporg/decap-cms/commit/22370b13e49a4a5f58a60ebd4bc40ce4b141eb11))

# [3.1.0-beta.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.1.0...decap-cms-widget-datetime@3.1.0-beta.0) (2023-10-20)

### Reverts

- Revert "chore(release): publish" ([b89fc89](https://github.com/decaporg/decap-cms/commit/b89fc894dfbb5f4136b2e5427fd25a29378a58c6))

## [3.0.3](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.0.2...decap-cms-widget-datetime@3.0.3) (2023-10-13)

**Note:** Version bump only for package decap-cms-widget-datetime

## [3.0.2](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.0.1...decap-cms-widget-datetime@3.0.2) (2023-09-06)

**Note:** Version bump only for package decap-cms-widget-datetime

## [3.0.1](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@3.0.0...decap-cms-widget-datetime@3.0.1) (2023-08-25)

### Bug Fixes

- update peer dependencies ([#6886](https://github.com/decaporg/decap-cms/issues/6886)) ([e580ce5](https://github.com/decaporg/decap-cms/commit/e580ce52ce5f80fa040e8fbcab7fed0744f4f695))

# [3.0.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@2.8.0...decap-cms-widget-datetime@3.0.0) (2023-08-18)

**Note:** Version bump only for package decap-cms-widget-datetime

# [2.8.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@2.8.0-beta.0...decap-cms-widget-datetime@2.8.0) (2023-08-18)

**Note:** Version bump only for package decap-cms-widget-datetime

# 2.8.0-beta.0 (2023-08-18)

### Features

- rename packages ([#6863](https://github.com/decaporg/decap-cms/issues/6863)) ([d515e7b](https://github.com/decaporg/decap-cms/commit/d515e7bd33216a775d96887b08c4f7b1962941bb))

## [2.7.5-beta.0](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@2.7.4...decap-cms-widget-datetime@2.7.5-beta.0) (2023-07-27)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.7.4](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@2.7.3...decap-cms-widget-datetime@2.7.4) (2021-09-13)

### Bug Fixes

- **deps:** update react-datetime ([#5803](https://github.com/decaporg/decap-cms/issues/5803)) ([477efa5](https://github.com/decaporg/decap-cms/commit/477efa58f1a26e60c9ba5c0405e11132ecb7c68a))

## [2.7.3](https://github.com/decaporg/decap-cms/compare/decap-cms-widget-datetime@2.7.2...decap-cms-widget-datetime@2.7.3) (2021-08-17)

### Bug Fixes

- make 'now' button consistent ([#5716](https://github.com/decaporg/decap-cms/issues/5716)) ([97de9da](https://github.com/decaporg/decap-cms/commit/97de9da948fff3b132d4d31c5f9069780abf3cc6))

## [2.7.2](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.7.1...decap-cms-widget-datetime@2.7.2) (2021-05-19)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.7.1](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.7.0...decap-cms-widget-datetime@2.7.1) (2021-05-19)

### Bug Fixes

- **deps:** update dependency react-datetime to v3 ([#5383](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/5383)) ([a2735b5](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/a2735b5fd68470821841f608ce2123e8ce74c4e0))

# [2.7.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.8...decap-cms-widget-datetime@2.7.0) (2021-05-04)

### Features

- added react 17 as peer dependency in packages ([#5316](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/5316)) ([9e42380](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/9e423805707321396eec137f5b732a5b07a0dd3f))

## [2.6.8](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.7...decap-cms-widget-datetime@2.6.8) (2021-02-25)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.6.7](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.6...decap-cms-widget-datetime@2.6.7) (2021-02-23)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.6.6](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.5...decap-cms-widget-datetime@2.6.6) (2021-02-10)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.6.5](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.4...decap-cms-widget-datetime@2.6.5) (2020-09-20)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.6.4](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.6.3...decap-cms-widget-datetime@2.6.4) (2020-09-15)

**Note:** Version bump only for package decap-cms-widget-datetime

## 2.6.3 (2020-09-08)

### Reverts

- Revert "chore(release): publish" ([828bb16](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/828bb16415b8c22a34caa19c50c38b24ffe9ceae))

## 2.6.2 (2020-08-20)

### Reverts

- Revert "chore(release): publish" ([8262487](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/82624879ccbcb16610090041db28f00714d924c8))

## 2.6.1 (2020-07-27)

### Reverts

- Revert "chore(release): publish" ([118d50a](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/118d50a7a70295f25073e564b5161aa2b9883056))

# [2.6.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.5.0...decap-cms-widget-datetime@2.6.0) (2020-06-18)

### Features

- add widgets schema validation ([#3841](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/3841)) ([2b46608](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/2b46608f86d22c8ad34f75e396be7c34462d9e99))

# [2.5.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.4.0...decap-cms-widget-datetime@2.5.0) (2020-05-19)

### Features

- add pickerUtc option to datetime widget ([#3721](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/3721)) ([ef5ff03](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/ef5ff031dab99f73468c32835e2d94311967e09c))

# [2.4.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.3.0...decap-cms-widget-datetime@2.4.0) (2020-04-14)

### Features

- **widget-datetime:** add now to datepicker ([#3484](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/3484)) ([79b8469](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/79b8469337dade3bd7472b3f42b826efc7e0987d))

# [2.3.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.6...decap-cms-widget-datetime@2.3.0) (2020-04-07)

### Features

- **yaml:** support comments ([#3529](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/3529)) ([4afbbdd](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/4afbbdd8a99241d239f28c5be544bb0ca77e345b))

## [2.2.6](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.5...decap-cms-widget-datetime@2.2.6) (2020-02-17)

### Bug Fixes

- **widget-datetime:** use default value when value is undefined ([#3269](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/3269)) ([8cc5fcb](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/8cc5fcbb1957b224fe3adb01364eb0de658ad666))

## [2.2.5](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.4...decap-cms-widget-datetime@2.2.5) (2019-11-07)

### Bug Fixes

- **widget-date:** allow empty value ([#2705](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2705)) ([d058697](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/d0586976443c4255ba122fba33bbe045069fc461))

## [2.2.4](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.3...decap-cms-widget-datetime@2.2.4) (2019-09-26)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.3](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.2...decap-cms-widget-datetime@2.2.3) (2019-07-24)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.2](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.2-beta.0...decap-cms-widget-datetime@2.2.2) (2019-04-10)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.2-beta.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.1...decap-cms-widget-datetime@2.2.2-beta.0) (2019-04-05)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.1](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.1-beta.2...decap-cms-widget-datetime@2.2.1) (2019-03-29)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.1-beta.2](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.1-beta.1...decap-cms-widget-datetime@2.2.1-beta.2) (2019-03-28)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.2.1-beta.1](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.1-beta.0...decap-cms-widget-datetime@2.2.1-beta.1) (2019-03-26)

### Bug Fixes

- export on decap-cms and maps on esm ([#2244](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2244)) ([6ffd13b](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/6ffd13b))

## [2.2.1-beta.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.2.0...decap-cms-widget-datetime@2.2.1-beta.0) (2019-03-25)

### Bug Fixes

- update peer dep versions ([#2234](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2234)) ([7987091](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/7987091))

# [2.2.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.1.0...decap-cms-widget-datetime@2.2.0) (2019-03-22)

### Features

- add ES module builds ([#2215](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2215)) ([d142b32](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/d142b32))

# [2.1.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.1.0-beta.0...decap-cms-widget-datetime@2.1.0) (2019-03-22)

**Note:** Version bump only for package decap-cms-widget-datetime

# [2.1.0-beta.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.8-beta.0...decap-cms-widget-datetime@2.1.0-beta.0) (2019-03-21)

### Features

- provide usable UMD builds for all packages ([#2141](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2141)) ([82cc794](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/82cc794))

## [2.0.8-beta.0](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.7...decap-cms-widget-datetime@2.0.8-beta.0) (2019-03-15)

### Features

- upgrade to Emotion 10 ([#2166](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/issues/2166)) ([ccef446](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/commit/ccef446))

## [2.0.7](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.6...decap-cms-widget-datetime@2.0.7) (2018-11-29)

**Note:** Version bump only for package decap-cms-widget-datetime

## [2.0.6](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.5...decap-cms-widget-datetime@2.0.6) (2018-11-12)

**Note:** Version bump only for package decap-cms-widget-datetime

<a name="2.0.5"></a>

## [2.0.5](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.4...decap-cms-widget-datetime@2.0.5) (2018-08-24)

**Note:** Version bump only for package decap-cms-widget-datetime

<a name="2.0.4"></a>

## [2.0.4](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.3...decap-cms-widget-datetime@2.0.4) (2018-08-07)

**Note:** Version bump only for package decap-cms-widget-datetime

<a name="2.0.3"></a>

## [2.0.3](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.2...decap-cms-widget-datetime@2.0.3) (2018-08-01)

**Note:** Version bump only for package decap-cms-widget-datetime

<a name="2.0.2"></a>

## [2.0.2](https://github.com/decaporg/decap-cms/tree/main/packages/decap-cms-widget-datetime/compare/decap-cms-widget-datetime@2.0.1...decap-cms-widget-datetime@2.0.2) (2018-07-28)

**Note:** Version bump only for package decap-cms-widget-datetime

<a name="2.0.1"></a>

## 2.0.1 (2018-07-26)

<a name="2.0.0"></a>

# 2.0.0 (2018-07-26)

**Note:** Version bump only for package decap-cms-widget-datetime
