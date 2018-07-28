# CONTRIBUTING

Contributions are always welcome, no matter how large or small. Before contributing,
please read the [code of conduct](CODE_OF_CONDUCT.md).

## Setup

> Install yarn on your system: [https://yarnpkg.com/en/docs/install](https://yarnpkg.com/en/docs/install)

```sh
$ git clone https://github.com/netlify/netlify-cms
$ cd netlify-cms
$ yarn start
```

## Available scripts

### `bootstrap`

Installs and bootstraps any CMS package dependencies.

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

## Pull Requests

We actively welcome your pull requests.

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. PR's must be rebased before merge (feel free to ask for help)
7. PR should be reviewed by two maintainers (@erquhart, @Benaiah, @tech4him1) prior to merging.

## Add yourself as a contributor

This project follows the [all contributors](https://github.com/kentcdodds/all-contributors) specification. To add yourself to the table of contributors on the README.md,
please use the automated script as part of your PR:

```console
yarn run add-contributor <YOUR_GITHUB_USERNAME>
```

Follow the prompt. If you've already added yourself to the list and are making a
new type of contribution, you can run it again and select the added contribution
type.

## License

By contributing to Netlify CMS, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
