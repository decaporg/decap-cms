![Decap CMS](/.github/decap.svg)

# decaporg/decap-cms

[![npm version](https://img.shields.io/npm/v/decap-cms.svg?style=flat)](https://www.npmjs.com/package/decap-cms)
[![npm last update](https://img.shields.io/npm/last-update/decap-cms)](https://www.npmjs.com/package/decap-cms)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/decaporg/decap-cms/blob/main/LICENSE)
[![core size](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdecaporg%2Fdecap-cms%2Fmain%2F.github%2Fbundle-size.json&query=%24.entries%5B%27.%2Fapp%2Fbare%27%5D.pretty&label=core%20size&color=informational)](packages/decap-cms/scripts/analyze.mjs)
[![last commit](https://img.shields.io/github/last-commit/decaporg/decap-cms?branch=main)](https://github.com/decaporg/decap-cms/commits/main)
[![commit activity](https://img.shields.io/github/commit-activity/m/decaporg/decap-cms)](https://github.com/decaporg/decap-cms/commits)
[![dependencies](https://img.shields.io/librariesio/github/decaporg/decap-cms?label=dependencies)](https://libraries.io/github/decaporg/decap-cms)

This repository is a pnpm workspace. The actual CMS - **`decap-cms`**, a single-package fork of
[Decap CMS](https://decapcms.org/) - lives in [`packages/decap-cms`](packages/decap-cms/README.md),
which has the full README covering what the fork is, how it differs from upstream, and how to use
it.

## Install

```sh
npm install decap-cms
```

The root export bootstraps the classic app. Individual parts (backends, widgets, the core engine, UI
primitives, plus the tree-shakeable `decap-cms/app/bare` entry) are importable through subpath
exports so you can assemble your own build. See the [package README](packages/decap-cms/README.md)
for usage, visual editing, and the config JSON Schema.

## Documentation

- [Package README](packages/decap-cms/README.md) - installation, usage, visual editing, and the
  config JSON Schema
- [Editor guide](docs/editor-guide.md) - for content editors: writing entries, the widget set, the
  editorial workflow, and the media library
- [Community widgets](docs/community-widgets.md) - curated list of third-party `registerWidget`
  packages, and how to list your own
- [Decap CMS documentation](https://www.decapcms.org/docs/intro/) - configuration, content modeling,
  and backend setup; applies to this fork unless noted below
- [Breaking changes in v4.beta](docs/contributing/decisions/breaking-changes-v4-beta.md) - how this
  fork differs from upstream
- [Contributing docs](docs/contributing/index.md) - design decisions and learnings behind the repo
- [CONTRIBUTING.md](CONTRIBUTING.md) - development guide and release process
- [Releases / change log](https://github.com/decaporg/decap-cms/releases) - every version,
  documented

## Repository layout

```
packages/
  decap-cms/           the published decap-cms package (source, tests, demo, build)
extensions/            reserved for packages that consume decap-cms as a third party (none yet)
docs/
  contributing/  design decisions and learnings (see docs/contributing/index.md)
  core/          core-engine notes
  editor-guide.md  end-user guide for content editors
  community-widgets.md  curated list of third-party registerWidget packages
```

The workspace shape lets sibling packages (plugins, tooling, server pieces) live under `packages/`
alongside the main CMS package without another restructure, mirroring the layout of the sibling
workspace repo. `extensions/` is a second, sibling root for packages that may only depend on
`decap-cms` through its published subpath exports (no reach into `packages/decap-cms/src`) - widgets
and other plugins would fall here rather than under `packages/`. It currently holds no packages: the
map widget, its last occupant, moved back into the CMS package so that v3 configs using
`widget: map` keep working. The reasoning for both roots is documented in
[restructure.md](docs/contributing/decisions/restructure.md).

## Working in this repo

Everything runs from the root through pnpm:

```sh
pnpm install
pnpm test:ci      # lint + typecheck + unit tests, per package
pnpm build        # builds every package
pnpm build:dev-test && pnpm serve:dev-test   # demo app on http://localhost:5174
```

Repo-wide tooling (formatting via dprint, git hooks via husky, commit linting) lives at the root;
each package is otherwise self-contained (its own tsconfig, ESLint config, tests, and build). See
[CONTRIBUTING.md](CONTRIBUTING.md) for the development guide.

## Decap Turbo

Need centralized user management, advanced roles, a database proxy, or premium support? Explore [Decap Turbo](https://decapcms.org/turbo/).

## Sponsors

Help support Decap CMS development by becoming a sponsor! Your contributions help us maintain and improve this open-source project.

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/decaporg)
[![Open Collective](https://img.shields.io/badge/Sponsor-Open%20Collective-blue?style=for-the-badge&logo=opencollective)](https://opencollective.com/decap)

### Main Partner

Decap CMS is supported by our main partner <a href="https://p-m.si/">PM</a>.

### Backers

![Open Collective Backers](https://opencollective.com/decap/backers.svg?limit=30&button=false&avatarHeight=48&width=400)

Thank you for your support!

## Expert Services

Get hands-on help from Decap experts and partners for onboarding, custom feature development, website development and premium support.

[Explore expert services](https://decapcms.org/services/)

## License

[MIT](LICENSE)
