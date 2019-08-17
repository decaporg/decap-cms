# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

For details on contributing to documentation, see [Website Directory Readme](https://github.com/netlify/netlify-cms/blob/master/website/README.md).

## Setup

> Install yarn on your system: [https://yarnpkg.com/en/docs/install](https://yarnpkg.com/en/docs/install)

### Install dependencies

> Only required on the first run, subsequent runs can use `yarn start` to both
bootstrap and run the development server.

```sh
$ git clone https://github.com/netlify/netlify-cms
$ cd netlify-cms
$ yarn
$ yarn bootstrap
```

### Run locally

```sh
$ yarn start
```

## Available scripts

### `bootstrap`

Bootstraps the monorepo.

#### Usage

```sh
$ yarn bootstrap
```

### `watch`

Watches all CMS packages and transpiles them on change.

#### Usage

```sh
$ yarn watch
```

### `start`

Starts the development server. This task runs both the `bootstrap` and `watch` scripts.

#### Usage

```sh
$ yarn start
```

### `clean`

Removes all of the CMS package `dist` directories.

#### Usage

```sh
yarn clean
```

### `reset`

Runs the `clean` script and removes all the `node_modules` from the CMS packages.

#### Usage

```sh
yarn reset
```

### `build`

Runs the `clean` script and builds the CMS packages.

#### Usage

```sh
yarn build
```

### `build-preview`

Runs the `build` and `build-preview` scripts in each package and serves the resulting build locally.

#### Usage

```sh
yarn build-preview
```

### `test`

Runs all the CMS package tests.

#### Usage

```sh
yarn test
```

### `format`

Formats code and docs according to our style guidelines.

#### Usage

```sh
yarn format
```

## Pull Requests

We actively welcome your pull requests!

If you need help with Git or our workflow, please ask on [Gitter.im](https://gitter.im/netlify/NetlifyCMS). We want your contributions even if you're just learning Git. Our maintainers are happy to help!

Netlify CMS uses the [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow) + [Feature Branches](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow). Additionally, PR's should be [rebased](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) on master when opened, and again before merging.

1. Fork the repo.
2. Create a branch from `master`. If you're addressing a specific issue, prefix your branch name with the issue number.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Run `yarn test` and ensure the test suite passes.
5. Use `yarn format` to format and lint your code.
6. PR's must be rebased before merge (feel free to ask for help).
7. PR should be reviewed by two maintainers prior to merging.

## License

By contributing to Netlify CMS, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
